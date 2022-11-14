const URL = 'http://localhost:3000';

//Adapter
const refs = {
  booksList: document.querySelector('[data-id="books-list"]'),
  createBookForm: document.querySelector('#create-book-form'),
  updateBookForm: document.querySelector('#update-book-form'),
  coverInput: document.querySelector('#cover'),
  coverDisplay: document.querySelector('#cover-display'),
  closeModalBtn: document.querySelector("[data-modal-close]"),
  modal: document.querySelector("[data-modal]"),
};

//Proxy
const services = {
  getBooks: function () {
    return fetch(`${URL}/books`).then(response => {
      if (!response.ok) {
        throw new Error(response.status)
      }

      return response.json()
    })
  },

  createBook: function (formData) {
    return fetch(`${URL}/books`,
      {
        method: 'POST', body: JSON.stringify(formData), headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      }).then(response => response.json());
  },

  deleteBook: function (bookId) {
    return fetch(`${URL}/books/${bookId}`,
      {
        method: 'DELETE'
      }).then(response => response.json())
  },

  updateBook: function (bookId, formData) {
    return fetch(`${URL}/books/${bookId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(formData), headers: {
          "Content-Type": "application/json; charset=UTF-8",
        }
      }).then(response => response.json())
  }
}

//Mediator
const layoutUtils = {
  renderBooks: function (books) {
    const markup = books
      .map(({ id, title, author, cover }) => {
        return `
          <li class="book" data-id="${id}">
          <img class="book-cover" src="${cover}">
          <div class="book-info">
            <h3>${title}</h3>
            <span>Author: ${author}</span>
            <button class="delete-book-btn">Delete</button>
            <button class="update-book-btn">Update</button>
          </div> 
          </li>
        `;
      })
      .join("");
    refs.booksList.innerHTML = markup;

    refs.deleteBookButtons = document.getElementsByClassName('delete-book-btn');
    Array.from(refs.deleteBookButtons).forEach(btn => btn.addEventListener('click', () => {
      services.deleteBook(btn.parentElement.parentElement.dataset.id).then(() => {
        this.refreshBookList();
      })
    }))

    refs.updateBookButtons = document.getElementsByClassName('update-book-btn');
    Array.from(refs.updateBookButtons).forEach(btn => btn.addEventListener('click', () => {
      this.toggleModal(btn.parentElement.parentElement.dataset.id);
    }))
  },

  refreshBookList: function () {
    services.getBooks().then(books => this.renderBooks(books));
  },

  toggleModal: function (bookId) {
    refs.modal.classList.toggle('is-hidden');
    refs.modal.dataset.id = bookId;
  }
}

//Proxy
const handleFormUtils = {
  uploadImage: async function (event) {
    const file = event.target.files[0];
    const base64 = await this.convertBase64(file);
    refs.coverDisplay.src = base64;
  },

  convertBase64: function (file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  },

  handleCreateBookSubmit: function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    this.convertBase64(formProps.cover).then(base64Img => {
      formProps.cover = base64Img
      services.createBook(formProps)
        .then(() => {
          layoutUtils.refreshBookList();
          refs.coverInput.value = '';
          refs.coverDisplay.removeAttribute("src");
        });
    });
  },

  handleUpdateBookSubmit: function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    services.updateBook(refs.modal.dataset.id, formProps).then(() => {
      layoutUtils.refreshBookList();
      layoutUtils.toggleModal();
    })
  }
}

//Global Execution
refs.coverInput.addEventListener('change', evt => {
  handleFormUtils.uploadImage(evt);
})

refs.createBookForm.addEventListener('submit', evt => {
  handleFormUtils.handleCreateBookSubmit(evt);
})

refs.updateBookForm.addEventListener('submit', evt => {
  handleFormUtils.handleUpdateBookSubmit(evt);
})

refs.closeModalBtn.addEventListener("click", layoutUtils.toggleModal);

layoutUtils.refreshBookList();