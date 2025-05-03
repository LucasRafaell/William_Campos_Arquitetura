/*****************************
 *         CONSTANTES        *
 *****************************/
const SELECTORS = {
  MENU: {
    BUTTON: '.menu-mobile',
    NAV: '.nav__list',
    ITEMS: '.nav__item a'
  },
  CARROSSEL: {
    CONTAINER: '.carrossel__container',
    PREV_BTN: '.carrossel__btn--prev',
    NEXT_BTN: '.carrossel__btn--next'
  },
  FORM: {
    FORM_ID: '#contact-form',
    PHONE_FIELD: '#phone'
  },
  GALLERY: {
    MODAL: '#gallery-modal',
    CLOSE_BTN: '.gallery-modal__close',
    IMAGE: '.gallery-modal__image',
    TITLE: '.gallery-modal__title',
    DESCRIPTION: '.gallery-modal__description',
    THUMBS: '.gallery-modal__thumbs'
  }
};

/*****************************
 *         COMPONENTES       *
 *****************************/

class MenuMobile {
  constructor() {
    this.elements = {
      button: document.querySelector(SELECTORS.MENU.BUTTON),
      nav: document.querySelector(SELECTORS.MENU.NAV),
      items: document.querySelectorAll(SELECTORS.MENU.ITEMS)
    };
    this.init();
  }

  init() {
    this.elements.button.addEventListener('click', () => this.toggleMenu());
    this.elements.items.forEach(item => {
      item.addEventListener('click', () => this.closeMenu());
    });
  }

  toggleMenu() {
    const isOpen = this.elements.nav.classList.toggle('active');
    this.updateButtonState(isOpen);
  }

  closeMenu() {
    this.elements.nav.classList.remove('active');
    this.updateButtonState(false);
  }

  updateButtonState(isOpen) {
    this.elements.button.innerHTML = isOpen ? '✕' : '☰';
    this.elements.button.setAttribute('aria-expanded', isOpen);
  }
}

class Carrossel {
  constructor() {
    this.elements = {
      container: document.querySelector(SELECTORS.CARROSSEL.CONTAINER),
      prevBtn: document.querySelector(SELECTORS.CARROSSEL.PREV_BTN),
      nextBtn: document.querySelector(SELECTORS.CARROSSEL.NEXT_BTN),
      filterBtns: document.querySelectorAll('.filter-btn'),
      searchInput: document.getElementById('project-search')
    };
    this.projects = [];
    this.filteredProjects = [];
    this.currentIndex = 0;
    this.currentFilter = 'all';
    this.sortBy = 'relevance';
    this.searchTerm = '';
    this.gallery = new GalleryModal();
    this.favorites = JSON.parse(localStorage.getItem('favoriteProjects')) || [];
    this.init();
  }

  init() {
    this.loadProjects();
    this.setupControls();
    this.setupFilters();
    this.setupSearch();
    this.setupSorting();
    this.setupFavorites();
    this.updateFavoritesSection();
  }

  loadProjects() {
    this.projects = [
      {
        id: 1,
        title: "Residencial Alphaville",
        description: "Casa moderna com 450m², integração indoor-outdoor e painéis solares.",
        image: "assets/imagens/projetos/projeto1/projeto1.png",
        type: "residencial",
        year: 2022,
        galleryImages: [
          "assets/imagens/projetos/projeto1/detalhes/projeto1-1.png",
          "assets/imagens/projetos/projeto1/detalhes/projeto1-2.png"
        ]
      },
      {
        id: 2,
        title: "Corporate Tower",
        description: "Edifício comercial com certificação LEED Platinum em São Paulo.",
        image: "assets/imagens/projetos/projeto2/projeto2.png",
        type: "comercial",
        year: 2021,
        galleryImages: [
          "assets/imagens/projetos/projeto2/detalhes/projeto2-1.png",
          "assets/imagens/projetos/projeto2/detalhes/projeto2-2.png"
        ]
      },
      {
        id: 3,
        title: "Loja Conceito",
        description: "Design de interiores comercial para marca de luxo.",
        image: "assets/imagens/projetos/projeto3/projeto3.png",
        type: ["comercial", "interiores"],
        year: 2023,
        galleryImages: [
          "assets/imagens/projetos/projeto3/detalhes/projeto3-1.png",
          "assets/imagens/projetos/projeto3/detalhes/projeto3-2.png"
        ]
      }
    ];

    this.filterProjects('all');
  }

  setupControls() {
    this.elements.prevBtn.addEventListener('click', () => this.prev());
    this.elements.nextBtn.addEventListener('click', () => this.next());
    this.elements.container.addEventListener('click', (e) => {
      const slide = e.target.closest('.carrossel__slide');
      if (slide) this.openGallery(parseInt(slide.dataset.index));
    });
  }

  setupFilters() {
    this.elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.elements.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterProjects(btn.dataset.filter);
      });
    });
  }

  setupSearch() {
    this.elements.searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase().trim();
      this.filterProjects(this.currentFilter);
    });

    document.querySelector('.search-btn').addEventListener('click', () => {
      this.filterProjects(this.currentFilter);
    });
  }

  setupSorting() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sortBy = btn.dataset.sort;
        this.filterProjects(this.currentFilter);
      });
    });
  }

  filterProjects(filter) {
    this.currentFilter = filter;

    // Filtra por categoria
    this.filteredProjects = filter === 'all'
      ? [...this.projects]
      : this.projects.filter(project => {
        if (Array.isArray(project.type)) {
          return project.type.includes(filter);
        }
        return project.type === filter;
      });

    // Aplica busca
    if (this.searchTerm) {
      this.filteredProjects = this.filteredProjects.filter(project => {
        const searchIn = [
          project.title,
          project.description,
          ...(Array.isArray(project.type) ? project.type : [project.type])
        ].join(' ').toLowerCase();

        return searchIn.includes(this.searchTerm);
      });
    }

    this.sortProjects();
    this.render();
  }

  sortProjects() {
    this.filteredProjects.sort((a, b) => {
      switch (this.sortBy) {
        case 'year':
          return b.year - a.year;
        case 'name':
          return a.title.localeCompare(b.title);
        default: // relevance
          return this.calculateRelevance(b) - this.calculateRelevance(a);
      }
    });
  }

  calculateRelevance(project) {
    if (!this.searchTerm) return 0;

    let score = 0;
    const fields = [project.title, project.description, project.type];

    fields.forEach(field => {
      if (Array.isArray(field)) {
        score += field.join(' ').toLowerCase().includes(this.searchTerm) ? 10 : 0;
      } else {
        score += field.toLowerCase().includes(this.searchTerm) ? 5 : 0;
      }
    });

    return score;
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.filteredProjects.length) % this.filteredProjects.length;
    this.scrollToSlide();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.filteredProjects.length;
    this.scrollToSlide();
  }

  scrollToSlide() {
    this.elements.container.scrollTo({
      left: this.elements.container.offsetWidth * this.currentIndex,
      behavior: 'smooth'
    });
  }

  openGallery(index) {
    const project = this.filteredProjects[index];
    const galleryData = {
      title: project.title,
      description: project.description,
      mainImage: project.image,
      images: project.galleryImages || [project.image] // Fallback caso não tenha galleryImages
    };
    this.gallery.open(galleryData);
  }

  render() {
    this.elements.container.innerHTML = this.filteredProjects
      .map((project, index) => `
      <article class="carrossel__slide" data-index="${index}" data-id="${project.id}">
        <button class="favorite-btn" aria-label="Favoritar projeto">
          <svg class="heart-icon" width="24" height="24" viewBox="0 0 24 24" fill="${this.isFavorite(project.id) ? '#D2976D' : 'none'}" stroke="#D2976D">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <img src="${project.image}" alt="${project.title}" loading="lazy">
        <div class="carrossel__content">
          <h3>${this.applySearchHighlight(project.title)}</h3>
          <p>${this.applySearchHighlight(project.description)}</p>
          <div class="project-meta">
            ${this.getTypeBadge(project.type)}
            <span class="project-year">${project.year}</span>
          </div>
        </div>
      </article>
      `)
      .join('');

    this.updateCounter();
  }

  applySearchHighlight(text) {
    if (!this.searchTerm) return text;

    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  getTypeBadge(type) {
    const types = Array.isArray(type) ? type : [type];
    return types.map(t => `
      <span class="badge ${t}">${this.formatTypeName(t)}</span>
    `).join('');
  }

  formatTypeName(type) {
    return {
      'residencial': 'Residencial',
      'comercial': 'Comercial',
      'interiores': 'Interiores'
    }[type] || type;
  }

  updateCounter() {
    const counter = document.querySelector('.filter-counter');
    if (!counter) return;

    counter.innerHTML = `
      Mostrando <strong>${this.filteredProjects.length}</strong> 
      de <strong>${this.projects.length}</strong> projetos
      ${this.searchTerm ? `para "<strong>${this.searchTerm}</strong>"` : ''}
    `;
  }

  setupFavorites() {
    this.elements.container.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.favorite-btn');
      if (!favBtn) return;

      e.stopPropagation();
      const slide = favBtn.closest('.carrossel__slide');
      const projectId = parseInt(slide.dataset.id);
      this.toggleFavorite(projectId, favBtn);
    });
  }

  toggleFavorite(projectId, btn) {
    const heartIcon = btn.querySelector('.heart-icon');
    const isFav = this.isFavorite(projectId);

    if (isFav) {
      this.favorites = this.favorites.filter(id => id !== projectId);
      heartIcon.setAttribute('fill', 'none');
    } else {
      this.favorites.push(projectId);
      heartIcon.setAttribute('fill', '#D2976D');
    }

    localStorage.setItem('favoriteProjects', JSON.stringify(this.favorites));
    this.updateFavoritesSection();
  }

  isFavorite(projectId) {
    return this.favorites.includes(projectId);
  }

  updateFavoritesSection() {
    const favSection = document.querySelector('.favorites-section');
    if (!favSection) return;

    const favProjects = this.projects.filter(p => this.favorites.includes(p.id));

    favSection.innerHTML = `
      <h2 class="section__title">Meus Projetos Favoritos</h2>
      <div class="favorites-grid">
        ${favProjects.map(project => `
          <div class="project-card">
            <img src="${project.image}" alt="${project.title}">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
}

class GalleryModal {
  constructor() {
    this.modal = document.getElementById('gallery-modal');
    this.modalImage = this.modal.querySelector('.gallery-modal__image');
    this.modalTitle = this.modal.querySelector('.gallery-modal__title');
    this.modalDescription = this.modal.querySelector('.gallery-modal__description');
    this.modalThumbs = this.modal.querySelector('.gallery-modal__thumbs');
    this.init();
  }

  init() {
    // Fechar modal
    this.modal.querySelector('.gallery-modal__close').addEventListener('click', () => {
      this.close();
    });

    // Fechar ao pressionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    // Fechar ao clicar fora
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(projectData) {
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Preencher dados
    this.modalImage.src = projectData.mainImage;
    this.modalImage.alt = projectData.title;
    this.modalTitle.textContent = projectData.title;
    this.modalDescription.textContent = projectData.description;

    // Miniaturas
    this.renderThumbs(projectData.images);
  }

  renderThumbs(images) {
    this.modalThumbs.innerHTML = images.map((img, index) => `
      <img src="${img}" alt="" class="gallery-modal__thumb ${index === 0 ? 'active' : ''}" 
           data-src="${img}">
    `).join('');

    // Eventos para miniaturas
    this.modalThumbs.querySelectorAll('.gallery-modal__thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.changeImage(thumb.dataset.src);
        this.setActiveThumb(thumb);
      });
    });
  }

  changeImage(src) {
    this.modalImage.style.opacity = 0;
    setTimeout(() => {
      this.modalImage.src = src;
      this.modalImage.style.opacity = 1;
    }, 200);
  }

  setActiveThumb(thumb) {
    this.modalThumbs.querySelectorAll('.gallery-modal__thumb').forEach(t => {
      t.classList.remove('active');
    });
    thumb.classList.add('active');
  }

  close() {
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

class ContactForm {
  constructor() {
    this.form = document.querySelector(SELECTORS.FORM.FORM_ID);
    this.init();
  }

  init() {
    this.setupPhoneMask();
    this.setupValidation();
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  setupPhoneMask() {
    const phoneField = document.querySelector(SELECTORS.FORM.PHONE_FIELD);

    phoneField.addEventListener('input', function (e) {
      const value = e.target.value.replace(/\D/g, '');
      let formattedValue = '';

      if (value.length > 0) {
        formattedValue = `(${value.substring(0, 2)}`;
        if (value.length > 2) {
          formattedValue += `) ${value.substring(2, 7)}`;
          if (value.length > 7) {
            formattedValue += `-${value.substring(7, 11)}`;
          }
        }
      }

      e.target.value = formattedValue;
    });
  }

  setupValidation() {
    const fields = this.form.querySelectorAll('[required]');

    fields.forEach(field => {
      field.addEventListener('input', () => this.validateField(field));
      field.addEventListener('blur', () => this.validateField(field));
    });
  }

  validateField(field) {
    const errorId = field.getAttribute('aria-describedby');
    const errorElement = document.getElementById(errorId);

    if (field.validity.valid) {
      field.classList.remove('invalid');
      errorElement.textContent = '';
    } else {
      field.classList.add('invalid');
      this.showError(field, errorElement);
    }
  }

  showError(field, errorElement) {
    if (field.validity.valueMissing) {
      errorElement.textContent = 'Este campo é obrigatório';
    } else if (field.validity.typeMismatch) {
      errorElement.textContent = field.type === 'email'
        ? 'Por favor, insira um e-mail válido'
        : 'Formato inválido';
    } else if (field.validity.patternMismatch) {
      errorElement.textContent = 'Use o formato (XX) XXXX-XXXX';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    const submitButton = this.form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.button__text');
    const loader = submitButton.querySelector('.button__loader');

    // Mostra loader
    buttonText.textContent = 'Enviando...';
    loader.hidden = false;
    submitButton.disabled = true;

    try {
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.showSuccess();
    } catch (error) {
      this.showError();
    } finally {
      buttonText.textContent = 'Enviar Mensagem';
      loader.hidden = true;
      submitButton.disabled = false;
    }
  }

  showSuccess() {
    alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
    this.form.reset();

    // Remove classes de erro
    this.form.querySelectorAll('.invalid').forEach(el => {
      el.classList.remove('invalid');
    });

    // Limpa mensagens de erro
    this.form.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
    });
  }

  showError() {
    alert('Ocorreu um erro ao enviar. Por favor, tente novamente mais tarde.');
  }
}

/*****************************
 *     INICIALIZAÇÃO         *
 *****************************/
document.addEventListener('DOMContentLoaded', () => {
  try {
    new MenuMobile();
    new Carrossel();
    new ContactForm();
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});