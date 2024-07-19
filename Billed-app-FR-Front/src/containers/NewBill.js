import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.isWrongFile = false;
    new Logout({ document, localStorage, onNavigate })

    // Appel de la méthode qui écoute tous les inputs requis et qui désactive le btn submit
    this.handleWaitingForm();
  }

  handleWaitingForm = () => {

    const form = this.document.querySelector('#form-new-bill')
    const submitBtn = this.document.querySelector('#btn-send-bill')
    const requiredFields = form.querySelectorAll("[required]")

    const checkForm = () => {
      if (form.checkValidity()) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    };
    requiredFields.forEach(field => {
      field.addEventListener("input", checkForm);
    });
  }

  handleChangeFile = e => {
    e.preventDefault();
    let errorFile = this.document.querySelector('#file-error-message');
    errorFile.innerHTML = "";
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length-1];
  
    // On autorise seulement ces extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png'];

    // Récupération de l'extension du fichier uploadé
    const fileExtension = fileName.split('.')[1];

    // On récupère le bouton du DOM pour le désactiver si le type de fichier est mauvais
    const button = this.document.querySelector('#btn-send-bill');
  
    if (!allowedExtensions.includes(fileExtension)) {
      errorFile.innerHTML = "Fichier non compatible, seuls les fichiers jpg, jpeg et png sont autorisés.";
      this.isWrongFile = true;
      button.disabled = true;
    } else {
      errorFile.innerHTML = "";
      button.disabled = false;
      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append('file', file);
      formData.append('email', email);
  
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true
          }
        })
        .then(({fileUrl, key}) => {
          console.log(fileUrl);
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
          this.isWrongFile = false;
        }).catch(error => {
          console.error(error);
        });
    }
  }
  handleSubmit = e => {
    e.preventDefault()
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }

    // Si l'extension du fichier joint est différente de null, alors on update la facture
    if(!this.isWrongFile) {
      this.updateBill(bill)
      this.onNavigate(ROUTES_PATH['Bills'])
  }}

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}