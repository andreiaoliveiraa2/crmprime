# Comando — /consultar-manual

> O assistente que responde dúvidas sobre operadoras na hora. Você ou seu corretor pergunta "qual plano atende X?" e a MPA responde com a informação CERTA do seu manual — nunca inventa. É o fim do "deixa eu confirmar e te retorno".

## Triggers

- `/consultar-manual`
- "consultar manual"
- "qual plano atende"
- "qual a carência de"
- "qual operadora"
- "[operadora] cobre"
- Qualquer pergunta técnica sobre planos/operadoras

## Quem executa

Comando MPA → Batman (busca no manual) → responde direto

## Como funciona

A MPA consulta os arquivos em `23_MANUAL_CORRETOR/operadoras/` e `23_MANUAL_CORRETOR/temas/` e responde com base no que está documentado.

## Exemplos de uso

**Pergunta de perfil:**
```
Corretor: "Qual operadora atende melhor criança de 2 anos na minha região?"

MPA: Consultando o manual...
Pra criança de 2 anos, suas melhores opções são:
• [Operadora A] — [plano] — tem a melhor rede pediátrica
• [Operadora B] — [plano] — carência de consulta menor (30 dias)

⚠️ Atenção: [Operadora C] tem rede limitada pra pediatria na nossa região.
```

**Pergunta de carência:**
```
Corretor: "Qual a carência de parto na [operadora]?"

MPA: Na [operadora], a carência de parto é de [X] dias (do manual, atualizado em [data]).
```

**Pergunta de cobertura:**
```
Corretor: "A [operadora] cobre [procedimento]?"

MPA: [resposta do manual]
Se não estiver no manual: "Não tenho essa info documentada ainda.
Recomendo confirmar com o gestor da [operadora]. Quer que eu marque
como pendência pra atualizar o manual depois?"
```

## Regra de ouro (CRÍTICA)

1. **NUNCA inventar.** Se a informação não está no manual, dizer que não está e orientar a confirmar com o gestor/operadora. Informação errada queima a venda e a credibilidade.
2. **Sempre citar a fonte e a data.** "Segundo o manual, atualizado em [data]." Assim o corretor sabe se pode estar desatualizado.
3. **Avisar quando estiver velho.** Se a info tem mais de X meses, sugerir reconfirmar.
4. **Diferenciar fato de recomendação.** Carência é fato (está na tabela). "Melhor operadora" é recomendação (baseada nos diferenciais documentados).

## Para equipes

Se a corretora tem subcorretores, todos consultam o MESMO manual — garantindo que toda a equipe passe a informação correta e padronizada. Isso é um diferencial enorme de qualidade.

## Conexão

- Quando falta info → sugere atualizar o manual (`como-alimentar.md`)
- Na qualificação de lead → o Batman pode consultar o manual para sugerir a operadora certa
- Antes de uma cotação → confirma carências e regras
