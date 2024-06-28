/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent, wait } from "@testing-library/dom"
import "@testing-library/jest-dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import router from '../app/Router'
import mockStore from "../__mocks__/store.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from '../__mocks__/localStorage.js';
import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store.js"

describe("Given I am connected as an employee", () => {

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  jest.mock("../app/store", () => mockStore)

  beforeEach(() => {

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    
    window.localStorage.setItem("user", JSON.stringify({type: "Employee", email: "employee@tld.com"}));

    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.append(root)

    router();

    root.innerHTML = NewBillUI();
  })

  afterEach(() => {
    document.body.innerHTML = "";
  })

  describe("When I am on NewBill Page", () => {

    test("Then it should initialize the form", () => {

      window.onNavigate(ROUTES_PATH.NewBill); 

      let typeDepense = screen.getByTestId("expense-type")
      typeDepense.value = "Transports";
      
      let nameDepense = screen.getByTestId("expense-name")
      nameDepense.value = "Transfert matériel audiovisuel";
      
      let datepicker = screen.getByTestId("datepicker")
      datepicker.value = "2022-05-10";
      
      let amount = screen.getByTestId("amount")
      amount.value = "1800";
      
      let vat = screen.getByTestId("vat")
      vat.value = "20";
      
      let pct = screen.getByTestId("pct")
      pct.value = "5";
      
      let commentary = screen.getByTestId("commentary")
      commentary.value = "";
      
      let fileInput = screen.getByTestId("file");
      const file = new File(['file'], 'test.jpg', {type: 'image/jpg'});
      userEvent.upload(fileInput, file);

      expect(typeDepense.value).toBeDefined();
      expect(nameDepense.value).toBeDefined();
      expect(datepicker.value).toBeDefined();
      expect(amount.value).toBeDefined();
      expect(vat.value).toBeDefined();
      expect(pct.value).toBeDefined();
      expect(commentary.value).toBeDefined();
      expect(fileInput.files[0].name).toBeDefined();  

    })

    it("should send the form with succes and redirect to the bills page", () => {

      const onNavigate = jest.fn();
      const alertLog = jest.spyOn(window, 'alert');

      const newBillComponent = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store: mockStore
      });

      window.onNavigate(ROUTES_PATH.NewBill); 
      
      const handleSubmitMock = jest.spyOn(newBillComponent, 'handleSubmit');
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeDefined();
      form.addEventListener('submit', handleSubmitMock);
      fireEvent.submit(form);
 
      expect(alertLog).not.toHaveBeenCalled(); 
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    })
  })

  

})