"""
API do Cadastro de Produtos
Recebe pedidos do site, guarda dados no banco (Neon) e imagens no
armazenamento de arquivos (Cloudflare R2).
"""
import os
import uuid
from pathlib import Path
from typing import Optional
# Em desenvolvimento local, carrega variáveis do arquivo .env.
# Em produção (Cloud Run), essas variáveis já vêm prontas do ambiente.
if Path(".env").exists():
    from dotenv import load_dotenv
    load_dotenv()
    
import boto3

import psycopg
from botocore.client import Config
from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
# ---------------------------------------------------------------------
# Configuração — lida das variáveis de ambiente, nunca escrita no código
# ---------------------------------------------------------------------
DATABASE_URL = os.environ["DATABASE_URL"]
R2_ACCOUNT_ID = os.environ["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET_NAME = os.environ["R2_BUCKET_NAME"]
R2_PUBLIC_URL = os.environ["R2_PUBLIC_URL"]
app = FastAPI(title="API do Cadastro de Produtos")
# Libera o acesso para qualquer site poder chamar esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)
def get_conn():
    return psycopg.connect(DATABASE_URL)

@app.on_event("startup")
def criar_tabela_se_nao_existir():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS produtos (
                id SERIAL PRIMARY KEY,
                codigo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                descricao_sucinta TEXT,
                fabricante TEXT,
                unidade_medida TEXT,
                imagem_url TEXT,
                criado_em TIMESTAMP NOT NULL DEFAULT now()
                )
            """)
        conn.commit()


@app.get("/")
def raiz():
    return {"status": "ok", "mensagem": "API do Cadastro de Produtos no ar"}


@app.get("/produtos")
def listar_produtos(
    id: Optional[int] = None,
    descricao: Optional[str] = None,
    fabricante: Optional[str] = None,
):

 
    """Lista produtos. Sem parâmetros, devolve todos. Com id/descricao/
    fabricante informados, filtra (descricao e fabricante aceitam parte do texto)."""
    sql = """
        SELECT id, codigo, descricao, descricao_sucinta, fabricante,
        unidade_medida, imagem_url
        FROM produtos
        WHERE 1=1
    """
    parametros = []
    if id is not None:
        sql += " AND id = %s"
        parametros.append(id)

    if descricao:
        sql += " AND descricao ILIKE %s"
        parametros.append(f"%{descricao}%")

    if fabricante:
        sql += " AND fabricante ILIKE %s"
        parametros.append(f"%{fabricante}%")
        sql += " ORDER BY id DESC"
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, parametros)
                colunas = [c.name for c in cur.description]
                linhas = cur.fetchall()

    return [dict(zip(colunas, linha)) for linha in linhas]


@app.post("/produtos")
async def criar_produto(
    codigo: str = Form(...),
    descricao: str = Form(...),
    descricao_sucinta: str = Form(""),
    fabricante: str = Form(""),
    unidade_medida: str = Form(""),
    imagem: Optional[UploadFile] = File(None),
):

    """Cadastra um novo produto. A imagem é opcional; se enviada, vai
    para o Cloudflare R2 e só a URL dela fica salva no banco."""
    if not codigo.strip() or not descricao.strip():
        raise HTTPException(400, "Código e descrição são obrigatórios.")

    imagem_url = None
    if imagem is not None and imagem.filename:
        conteudo = await imagem.read()
        if len(conteudo) > 5 * 1024 * 1024:
            raise HTTPException(400, "Imagem maior que 5 MB.")
        
        nome_no_bucket = f"{uuid.uuid4()}-{imagem.filename}"
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=nome_no_bucket,
            Body=conteudo,
            ContentType=imagem.content_type or "application/octet-stream",
        )
        imagem_url = f"{R2_PUBLIC_URL}/{nome_no_bucket}"

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
            """
            INSERT INTO produtos
            (codigo, descricao, descricao_sucinta, fabricante, unidade_medida,
            imagem_url)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (codigo, descricao, descricao_sucinta, fabricante, unidade_medida,
imagem_url),
            )
            novo_id = cur.fetchone()[0]
        conn.commit()
    return {"id": novo_id, "mensagem": "Produto cadastrado com sucesso."}