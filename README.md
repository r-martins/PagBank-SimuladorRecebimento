# Simulador de Parcelamento PagBank

Simulador de recebimento para vendas com PagBank (PIX, boleto, cartão à vista e parcelado de 2x a 12x). Mostra quanto o vendedor recebe líquido em cada forma de pagamento, com opção de assumir juros em até N parcelas e escolha do modelo de recebimento no cartão (14 ou 30 dias).

As taxas utilizadas são **exclusivas para transações realizadas com [PagBank Integrações](https://pbintegracoes.com/?utm_source=github&utm_medium=referral&utm_campaign=simulador-recebimento)** e não se aplicam a outras integrações diretas com PagBank nem ao mundo físico (Moderninhas).

---

## Ver o simulador em funcionamento

- **[Simulador na PbIntegracoes (compare)](https://pbintegracoes.com/compare/?utm_source=github&utm_medium=referral&utm_campaign=simulador-recebimento#simulador)** — versão em produção no site.

- **[PbIntegracoes](https://pbintegracoes.com/?utm_source=github&utm_medium=referral&utm_campaign=simulador-recebimento)** — integrações PagBank com taxas reduzidas.

---

## Como usar (embed)

1. Inclua o script na página (via CDN ou arquivo local):

```html
<script src="https://cdn.jsdelivr.net/gh/r-martins/PagBank-SimuladorRecebimento@master/pagbank-simulador.min.js"></script>
```

2. Crie um container e inicialize o simulador:

```html
<div id="pagbank-simulador"></div>
<script>
  PagBankSimulador.init({ container: '#pagbank-simulador' });
</script>
```

O parâmetro `container` pode ser um seletor CSS (ex.: `'#pagbank-simulador'`) ou um elemento DOM.

---

## Taxas consideradas (PbIntegracoes)

| Forma        | Taxa / regra              | Recebimento   |
|-------------|----------------------------|---------------|
| PIX         | 0,99%                      | Na hora       |
| Boleto      | R$ 1,99 fixo               | Em 2 dias     |
| Cartão      | 3,97% (14 dias) ou 3,05% (30 dias) | 14 ou 30 dias |
| Parcelado   | Juros compostos 3,49% a.m. (Tabela Price) | Conforme modelo 14/30 dias |

O usuário pode informar o valor da venda (padrão R$ 100), escolher em quantas vezes assume o juro do parcelamento (1x a 12x) e, no cartão, se recebe em 14 ou 30 dias.

---

## Estrutura do projeto

- `pagbank-simulador.js` — script do simulador (cálculos + UI), em um único arquivo para embed.
- `index.html` — página de exemplo com um container e chamada a `PagBankSimulador.init()`.

---

## Créditos

Simulador desenvolvido para uso com as integrações PagBank da **[PbIntegracoes](https://pbintegracoes.com/?utm_source=github&utm_medium=referral&utm_campaign=simulador-recebimento)**.

O simulador **não utiliza as taxas oficiais do PagBank**, e sim as **taxas de parceiro**, válidas apenas para quem utiliza as integrações da PbIntegracoes.
