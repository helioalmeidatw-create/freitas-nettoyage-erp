# CleanPro ERP — Sistema de Gestão Empresarial para Empresas de Limpeza

O **CleanPro ERP** é um sistema completo, moderno, multilingue e funcional desenvolvido especificamente para empresas prestadoras de serviços de limpeza em edifícios, condomínios, escadas, pisos, escritórios e áreas comuns.

---

## 🚀 Como Iniciar a Aplicação

O sistema é composto por um servidor backend com API REST e base de dados persistente, e uma aplicação frontend em React com TypeScript e Tailwind CSS.

### 1. Iniciar o Backend (Porta 5000):
```powershell
cd server
node ./node_modules/tsx/dist/cli.mjs src/index.ts
```

### 2. Iniciar o Frontend (Porta 5173):
```powershell
cd client
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
```

Aceda no navegador em: **[http://127.0.0.1:5173](http://127.0.0.1:5173)**

---

## 🌐 Funcionalidades Principais Implementadas

### 1. Sistema Multilingue Completo (PT / FR / EN)
* Seletor rápido visível no cabeçalho (**PT**, **FR**, **EN**).
* Tradução instantânea de 100% da interface: menus laterais, botões, tabelas, formulários, alertas, relatórios e documentos.
* Preferência guardada automaticamente na sessão do utilizador.
* Documentos comerciais (Orçamentos e Faturas) gerados no idioma selecionado.

### 2. Painel Principal (Dashboard)
* **Indicadores em Tempo Real**: Total de Clientes, Imóveis, Serviços Hoje, Concluídos, Pendentes e Atrasados.
* **Cálculo Financeiro Real**: Faturação Recebida, Saldos em Dívida, Despesas e Margem Líquida.
* **Gráfico de Evolução Financeira**: Comparação mensal calculada com base nos registos da base de dados.
* **Agenda de Próximas Intervenções**: Acesso rápido aos próximos trabalhos operacionais.
* **Feed de Atividades**: Registo de auditoria das ações executadas no sistema.

### 3. Gestão de Clientes & Fichas Técnicas
* Registo detalhado por tipo: *Condomínio*, *Administrador de Condomínio*, *Empresa*, *Particular* ou *Agência Imobiliária*.
* Campos completos de identificação fiscal: NIF, Número de IVA Intracomunitário e SIRET.
* **Ficha Individual Completa**: Consulta dos imóveis geridos, contratos em vigor, faturas emitidas e histórico de intervenções.

### 4. Gestão de Imóveis e Condomínios
* Ficha técnica por edifício: número de pisos, escadas, elevadores, entradas e áreas comuns (m²).
* Tipologia de pavimentos (mármore, granito, vinílico, cerâmica) e produtos recomendados.
* Registo de **Códigos de Acesso** (digicodes, cofres de chaves), contactos do porteiro e horários autorizados.

### 5. Serviços de Limpeza & Intervenções
* Categorias dedicadas: *Limpeza de Escadas*, *Pisos e Pavimentos*, *Elevadores*, *Corredores*, *Halls de Entrada*, *Escritórios*, *Vidros*, *Fim de Obra*, etc.
* Alocação de equipas e funcionários.
* **Automação de Recorrência**: Gera automaticamente os próximos agendamentos (semanais, quinzenais, mensais) sem duplicações.

### 6. Controlo de Qualidade & Checklist de Intervenção
* Checklist interativa tarefa a tarefa para cada serviço.
* Registo de inconformidades com sinalização de "Requer Correção".
* Registo de validação e data de inspeção.

### 7. Agenda & Planeamento Operacional
* Vistas em **Semana**, **Dia** e **Mês**.
* Visualização por equipas de trabalho e moradas de intervenção.
* Interface adaptada para consulta em tablets e dispositivos móveis pelas equipas de campo.

### 8. Orçamentos Comerciais & Conversão Direta
* Numeração sequencial automática (`ORC-2026-XXX`).
* Adição dinâmica de linhas de serviço, quantidades, unidades e cálculo automático de IVA.
* **Conversão em 1 Clique**: Um orçamento aceite é automaticamente transformado num **Contrato Oficial** e numa **Intervenção Agendada**, sem necessidade de redigitar dados.
* **Emissão em PDF**: Documento profissional com logótipo, dados da empresa e termos comerciais.

### 9. Contratos de Prestação de Serviços
* Gestão de contratos ativos, suspensos e datas de termo.
* Acompanhamento de avenças mensais e prazos de renovação.

### 10. Faturação & Recebimentos
* Emissão de faturas com numeração fiscal (`FT-2026-XXX`).
* Suporte aos requisitos legais portugueses (NIF) e franceses (**SIRET**, TVA).
* **Registo de Pagamentos Parciais e Totais**: Atualização automática do estado para *Emitida*, *Parcialmente Paga* ou *Paga*.
* **Exportação em PDF** e **Exportação em CSV** para integração contabilística.

### 11. Artigos, Químicos & Controlo de Stock
* Cadastro de detergentes, desinfetantes, recargas de mopa e máquinas.
* **Alerta Visual de Stock Mínimo** automático para reposição.
* Registo de movimentos de stock: Entrada (compra) e Saída (abastecimento de carrinhas de limpeza).

### 12. Despesas e Custos Operacionais
* Classificação por categorias: produtos químicos, combustíveis, manutenção de viaturas, fardamento/EPI, seguros e equipamentos.
* Associação opcional a fornecedores.

### 13. Fornecedores
* Ficha comercial de distribuidores de produtos de limpeza e máquinas industriais.

### 14. Relatórios & Rentabilidade
* Análise de rentabilidade por cliente e por condomínio atendido.
* Balanço entre volume faturado, montantes cobrados e saldos pendentes.

### 15. Definições da Empresa (Personalização sem Código)
O administrador pode alterar a qualquer momento:
* **Nome Comercial e Razão Social**
* **Cor Principal da Marca** (muda o tema de todo o sistema instantaneamente)
* **Logótipo da Empresa**
* Contactos (telefone, telemóvel, e-mail e sede)
* Dados fiscais (**NIF**, **IVA**, **SIRET**)
* Dados bancários (**IBAN**, **BIC**, Nome do Banco)
* Menções legais e termos de faturas e orçamentos
* **Cópias de Segurança**: Descarregar cópia completa em JSON ou restaurar dados de demonstração.

---

## 🔒 Segurança e Dados

* Base de dados estruturada e persistente em ficheiro seguro (`server/data/cleanpro_data.json`).
* Registo de auditoria (*Audit Logs*) de acessos e operações críticas.
* Validações de integridade relacional entre clientes, imóveis, contratos e intervenções.
