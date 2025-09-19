# Kanban Board

Um sistema Kanban completo e modular desenvolvido em JavaScript vanilla com módulos ES6.

## 🚀 Funcionalidades

### Core
- **Swimlanes (Lanes)**: Organize projetos em diferentes contextos
- **Colunas personalizáveis**: Defina seu fluxo de trabalho
- **Cards completos**: Título, responsável, duração, custo, descrição, tags e ferramentas
- **Drag & Drop**: Mova cards entre colunas e lanes facilmente
- **Cabeçalho de colunas**: Visualize totais de tempo por coluna

### Filtros e Busca
- **Busca em tempo real**: Por título, responsável ou descrição
- **Filtros avançados**: Por tags, ferramentas e lanes
- **Filtros salvos**: Guarde combinações de filtros frequentes
- **Estatísticas**: Visualize quantos cards estão visíveis/ocultos

### Personalização
- **Temas**: Claro e escuro
- **Tags coloridas**: Organize por prioridade, tipo, etc.
- **Cores de cards**: Identifique visualmente diferentes tipos
- **Cálculos de tempo**: Suporte a formatos como 2h, 1.5h, 90m, 1:30

### Import/Export
- **Backup automático**: Mantém últimas 5 versões
- **Export JSON**: Baixe seus dados
- **Import JSON**: Restaure ou migre dados
- **Compatibilidade**: Suporte a formatos antigos

## 📁 Estrutura do Projeto

```
kanban/
├── index.html              # Página principal
├── styles/
│   └── main.css            # Estilos CSS
├── js/
│   ├── app.js              # Coordenador principal
│   ├── state.js            # Gerenciamento de estado
│   ├── ui.js               # Renderização da interface
│   ├── modals.js           # Sistema de modais
│   ├── theme.js            # Gerenciamento de temas
│   ├── import-export.js    # Import/export com backup
│   ├── drag-drop.js        # Funcionalidade drag & drop
│   ├── filters.js          # Sistema de filtros
│   └── utils.js            # Funções utilitárias
└── package.json            # Configuração do projeto
```

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Python 3 (para servidor local)
- Navegador moderno com suporte a ES6 modules

### Executar localmente
```bash
# Clone ou baixe o projeto
cd kanban

# Servir via HTTP (necessário para módulos ES6)
python3 -m http.server 8000

# Acesse no navegador
# http://localhost:8000
```

### Comandos NPM (opcionais)
```bash
npm run dev    # Inicia servidor de desenvolvimento
npm run serve  # Alias para dev
```

## 🎯 Novas Funcionalidades (v1.1)

### Cabeçalho de Colunas
- Exibe o nome de cada coluna acima das lanes
- Mostra o total de horas de cada coluna (somando todas as lanes)
- Facilita visualização do progresso geral

### Scroll Otimizado
- Barra de rolagem movida para o nível do quadro (não por lane)
- Mantém colunas alinhadas quando há muitas colunas
- Melhor experiência visual e usabilidade

## 📊 Formato de Duração

O sistema suporta múltiplos formatos:
- **Horas e minutos**: `2h 30m`, `1h`
- **Decimais**: `1.5h`, `2.25h`
- **Minutos**: `90m`, `120m`
- **Formato relógio**: `1:30`, `2:45`
- **Dias**: `2d` (= 16h, considerando 8h/dia)
- **Semanas**: `1w` (= 40h, considerando 5 dias úteis)

## 🔧 Configuração do Servidor

### Subdomínio (GoDaddy)
1. Painel GoDaddy > DNS
2. Adicionar registro CNAME: `kanban` -> `@`
3. Ou registro A: `kanban` -> IP do servidor

### Upload
1. Criar pasta `/kanban/` no servidor
2. Upload mantendo estrutura de pastas
3. Verificar permissões dos arquivos

### URL de Produção
```
https://kanban.diogomartins.com
```

## 🧪 Testes

### Checklist Local
- [ ] Lanes e colunas aparecem
- [ ] Cards são criados e editados
- [ ] Drag & drop funciona
- [ ] Filtros funcionam
- [ ] Temas alternam
- [ ] Import/export funciona
- [ ] Cabeçalho de colunas aparece
- [ ] Scroll horizontal funciona

### Checklist Produção
- [ ] HTTPS funcional
- [ ] Sem erros no console
- [ ] Performance adequada
- [ ] Compatibilidade cross-browser

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

### Funcionalidades Móveis
- Touch drag & drop (implementado)
- Layout responsivo
- Controles otimizados para touch

## 🎨 Personalização

### Cores do Tema
Edite as variáveis CSS em `styles/main.css`:
```css
:root {
  --bg: #0f1115;        /* Fundo principal */
  --panel: #171a21;     /* Painéis */
  --accent: #7c9fff;    /* Cor de destaque */
  /* ... outras variáveis */
}
```

### Adicionando Novas Funcionalidades
1. Crie módulo em `/js/`
2. Import no `app.js`
3. Inicialize na classe `KanbanApp`

## 📝 Licença

MIT License - Livre para uso pessoal e comercial.

## 🤝 Contribuição

Para melhorias ou correções:
1. Identifique o módulo relevante
2. Faça as alterações
3. Teste localmente
4. Documente mudanças

---

**Versão**: 1.1  
**Última atualização**: Dezembro 2024  
**Autor**: Diogo Martins