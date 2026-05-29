const { ipcRenderer } = require('electron');

const { createApp, ref, onMounted } = Vue;

createApp({
  data() {
    return {
      produtos: [],
      search: '',
      form: { nome: '', codigo: '', medidas: '', imagemPath: '' },
      imagemFile: null,
      showModal: false,
      editandoId: null,
      modalImage: { src: '' },
      showAbout: false,
      stickyOffset: 60,
      searchTimeout: null
    };
  },
  methods: {
    resolverImagemSrc(imagem) {
      if (!imagem) return '../assets/imagens/sem-imagem.png';
      if (imagem.startsWith('file:///')) return imagem;
      if (/^[a-zA-Z]:\\\\/.test(imagem)) return `file:///${imagem.replace(/\\\\/g, '/')}`;
      return `../${imagem}`;
    },
    async load() {
      const produtos = await ipcRenderer.invoke('listar-produtos');
      this.produtos = produtos || [];
    },
    onSearchInput() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.searchRemote(), 300);
    },
    async searchRemote() {
      const termo = this.search.trim();
      if (!termo) return this.load();
      const produtos = await ipcRenderer.invoke('buscar-produtos', termo);
      this.produtos = produtos || [];
    },
    openModal() {
      this.editandoId = null;
      this.form = { nome: '', codigo: '', medidas: '', imagemPath: '' };
      this.imagemFile = null;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    editProduct(p) {
      this.editing = true;
      this.editandoId = p.id;
      this.form.nome = p.nome;
      this.form.codigo = p.codigo;
      this.form.medidas = p.medidas || '';
      this.form.imagemPath = p.imagem || '';
      this.showModal = true;
    },
    async save() {
      try {
        let imagem = this.form.imagemPath || '';
        if (this.imagemFile) {
          const bytes = Array.from(new Uint8Array(await this.imagemFile.arrayBuffer()));
          imagem = await ipcRenderer.invoke('salvar-imagem', { name: this.imagemFile.name, data: bytes });
        }

        if (this.editandoId) {
          await ipcRenderer.invoke('editar-produto', { id: this.editandoId, nome: this.form.nome, codigo: this.form.codigo, medidas: this.form.medidas, imagem });
        } else {
          await ipcRenderer.invoke('adicionar-produto', { nome: this.form.nome, codigo: this.form.codigo, medidas: this.form.medidas, imagem });
        }
      } catch (err) {
        if (err && err.message === 'CODIGO_DUPLICADO') {
          alert('Já existe um produto com esse código. Use outro código.');
          return;
        }
        console.error(err);
        alert('Não foi possível salvar o produto.');
        return;
      }

      this.closeModal();
      await this.load();
    },
    onFileChange(e) {
      const f = e.target.files && e.target.files[0];
      if (f) this.imagemFile = f;
    },
    async deleteProduct(id) {
      if (!confirm('Confirma exclusão do produto?')) return;
      await ipcRenderer.invoke('deletar-produto', id);
      await this.load();
    },
    openImage(src) {
      const caminho = this.resolverImagemSrc(src);
      this.modalImage.src = caminho;
    },
    closeImage() {
      this.modalImage.src = '';
    },
    openAbout() {
      this.showAbout = true;
      const el = document.getElementById('versaoModal');
      if (el && window.api && typeof window.api.getVersion === 'function') {
        el.innerText = window.api.getVersion();
      }
    },
    closeAbout() {
      this.showAbout = false;
    },
    atualizarOffsetStickyTabela() {
      const header = document.querySelector('.header');
      if (!header) return;
      const alturaHeader = Math.ceil(header.getBoundingClientRect().height);
      this.stickyOffset = alturaHeader;
      document.documentElement.style.setProperty('--sticky-header-offset', `${alturaHeader}px`);
    }
  },
  mounted() {
    this.load();
    // Preenche versão no footer e modal (se disponível)
    ipcRenderer.invoke('get-version').then(v => {
      const f = document.getElementById('versao');
      if (f) f.innerText = v;
      const vm = document.getElementById('versaoModal');
      if (vm) vm.innerText = v;
    }).catch(()=>{});
    this.atualizarOffsetStickyTabela();
    setTimeout(() => this.atualizarOffsetStickyTabela(), 0);

    window.addEventListener('resize', () => this.atualizarOffsetStickyTabela());

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.modalImage.src) this.closeImage();
        if (this.showModal) this.closeModal();
        if (this.showAbout) this.closeAbout();
      }

      const tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
      const estaDigitando = tag === 'input' || tag === 'textarea' || tag === 'select' || (event.target && event.target.isContentEditable);

      if (!estaDigitando && !event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'q') {
        const searchInput = document.getElementById('search');
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }
}).mount('#app');