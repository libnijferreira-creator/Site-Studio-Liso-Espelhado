# Como colocar o site no ar — Oracle Cloud (grátis para sempre)

> Resumo: você cria a **conta + servidor** na Oracle (5–15 minutos, **R$ 0**,
> cartão serve só para validação e **não cobra nada**), cola **uma chave SSH**
> que eu gerei e me passa o **IP**. Todo o resto (código, Docker, banco,
> testes) eu faço.

---

## 1. O que você precisa ter em mãos

- Um e-mail válido
- Um celular (vão pedir SMS/ligação na hora da validação)
- Um cartão de crédito/débito internacional (Mastercard/Visa). A Oracle faz uma
  validação temporária e **não é uma cobrança do plano** — o plano Always Free
  é R$ 0 para sempre.

---

## 2. Criar a conta Oracle Cloud (você)

1. Abra **https://cloud.oracle.com/free** (ou pesquise “Oracle Cloud free tier”).
2. Clique em **Start for free** / **Comece grátis**.
3. Preencha: país, nome, e-mail, senha (anote a senha) e aceite os termos.
4. Confirme o e-mail (chega um código).
5. Escolha **Conta pessoal** (Home/Individual) quando perguntarem o tipo.
6. Dados de país + telefone → código de verificação por SMS.
7. Dados do cartão → validação (valor simbólico devolvido em seguida).
8. Termine o cadastro e entre no console (**https://cloud.oracle.com**).

> Dica: na escolha de **região**, prefira **South America (São Paulo) —
> sa-vinhedo-1**, que é mais rápido para o Brasil.

---

## 3. Criar o servidor (você, ~5 minutos)

No painel da Oracle:

1. Menu (hambúrguer) → **Compute** → **Instances** → **Create instance**.
2. **Name**: `studio-liso`.
3. **Image (OS)**: clique em *Change image* → **Ubuntu** → versão **22.04** ou
   **24.04** → *Select image*.
4. **Shape**: *Change shape* → marque **Always Free eligible** → escolha
   **VM.Standard.A1.Flex (Ampere)** → **1 OCPU** e **6 GB de RAM**.
   (É o ARM grátis — o Docker do site roda nele sem problema.)
5. **Add SSH keys** → **Paste public keys** → cole exatamente isto:

   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILKFYUfyKeMQYfikCY7ShsH/aXCN0GyS28mrYGBIo2qT studio-liso-oracle
   ```

   > Essa chave pública é para a Oracle me deixar entrar. A **chave privada
   > fica só no seu computador** (`deploy\oracle\oracle_key`) — não compartilhe
   > esse arquivo com ninguém.
6. **Boot volume**: aumente para **45 GB**.
7. Clique em **Create** e aguarde a instância ficar *Running* (1–2 min).

---

## 4. Abrir as portas22 e80 (você, ~2 minutos)

A Oracle bloqueia tudo por padrão:

1. Menu → **Networking** → **Virtual cloud networks** → clique na rede da conta.
2. **Default Security List** (Security lists) → **Add ingress rules**:
   - **Source CIDR**: `0.0.0.0/0` · **Destination Ports**: `22` → **Add**
   - Repita para `80`
   - (Se a regra22 já existir, não precisa criar de novo.)
3. Volte para **Compute → Instances** e copie o **Public IP address**.

---

## 5. Me passe (aqui no chat)

- O **IP público** da instância (algo como `129.1xx.xxx.xxx`)
- Confirmação de que você colou a chave SSH no passo3

---

## 6. O que eu faço em seguida (sem precisar de você)

1. Testo o acesso por SSH com a chave que gerei.
2. Subo todo o código do site para o servidor.
3. Instalo o Docker e sobo o site com `docker compose` (porta80).
4. Configuro para reiniciar sozinho (queda de energia/reinício da Oracle).
5. Crio o banco novo — os29 serviços e as configurações entram sozinhos.
6. Testo o site no ar (página inicial, catálogo e `/admin/login`).

---

## 7. Assim que o site estiver no ar (você)

1. Abra `http://SEU_IP` no celular — o site abre normalmente.
2. Entre em `http://SEU_IP/admin/login` com o usuário/senha que definimos.
3. **Troque a senha**: painel → **Usuários** → *Alterar senha*.
4. **Crie o2º login**: **+ Novo login** → usuário + senha (mínimo8 caracteres).
   Pronto: as duas pessoas entram ao mesmo tempo, cada uma na sua sessão.
5. Compartilhe o endereço `http://SEU_IP` com as clientes.

---

## 8. Onde ficam os dados e como fazer backup

- **Banco de agendamentos**: `~/studio-liso/data/studio.db` (pasta montada fora
  do container — continua existindo mesmo se o container for recriado).
- **Fotos enviadas**: `~/studio-liso/public/uploads`.
- **Backup manual** (pode rodar com o site ligado):

  ```bash
  cd ~/studio-liso && docker exec studio-liso node scripts/backup.mjs
  ```

  Os backups ficam em `data/backups/` e os14 mais recentes são mantidos.

---

## 9. Como atualizar o site depois

Eu subo uma versão nova com um comando: copio o código atualizado e rodo
`docker compose up -d --build`. O banco e as fotos **não são apagados** (estão
em volumes fora da imagem).

---

## 10. Pendências conhecidas (ainda não fazem parte do site no ar)

- **Pagamentos**: hoje o site roda em **modo demonstração** (botão “Simular
  pagamento aprovado”). Para cobrar de verdade falta: **conta bancária +
  cadastro no Mercado Pago** (decidimos deixar para depois) e **domínio próprio
  + HTTPS**, que é exigido pelo webhook do Mercado Pago. Quando tiver domínio,
  adiciono o Caddy (HTTPS automático e grátis) no mesmo servidor.
- **Fotos**: as imagens da galeria/mostruário ainda são de exemplo — as suas
  fotos entram pelo painel (Mostruário).

---

## 11. Cuidados com o plano Always Free

- Usamos **1 OCPU +6 GB** de um limite de **4 OCPU +24 GB** — folga enorme.
- Não crie outras máquinas grandes na mesma conta: o que passar do limite é
  cobrado.
- Mantenha a conta com cartão válido; o plano é gratuito enquanto a conta
  estiver dentro das regras.
