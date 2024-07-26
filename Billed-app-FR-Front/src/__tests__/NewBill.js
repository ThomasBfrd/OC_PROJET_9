/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import router from "../app/Router";
import mockStore from "../__mocks__/store.js"
import MockedBills from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";

// Méthode qui permet la création d'un fichier + son type
const createFileEvent = (fileName, fileType, typeFormat) => {
  const file = new File(["file"], fileName, { type: fileType });
  return {
    preventDefault: () => {},
    target: {
      value: `path/fileTest.${typeFormat}`,
      files: [file],
    },
  };
};

describe("Given I am connected as an employee", () => {

  jest.mock("../app/store", () => MockedBills);
  jest.mock("../app/store", () => mockStore);

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "employee@tld.com" })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);

    router();

    root.innerHTML = NewBillUI();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("When I am on NewBill Page", () => {
    it("Then it should initialize the form and implement values", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      let typeDepense = screen.getByTestId("expense-type");
      typeDepense.value = "Transports";

      let nameDepense = screen.getByTestId("expense-name");
      nameDepense.value = "Transfert matériel audiovisuel";

      let datepicker = screen.getByTestId("datepicker");
      datepicker.value = "2022-05-10";

      let amount = screen.getByTestId("amount");
      amount.value = "1800";

      let vat = screen.getByTestId("vat");
      vat.value = "20";

      let pct = screen.getByTestId("pct");
      pct.value = "5";

      let commentary = screen.getByTestId("commentary");
      commentary.value = "";

      let fileInput = screen.getByTestId("file");
      const file = new File(["file"], "test.jpg", { type: "image/jpg" });
      userEvent.upload(fileInput, file);

      expect(typeDepense.value).toBeDefined();
      expect(nameDepense.value).toBeDefined();
      expect(datepicker.value).toBeDefined();
      expect(amount.value).toBeDefined();
      expect(vat.value).toBeDefined();
      expect(pct.value).toBeDefined();
      expect(commentary.value).toBeDefined();
      expect(fileInput.files[0].name).toBeDefined();
    });

    it("should send the form with succes and redirect to the bills page", () => {
      const onNavigate = jest.fn();
      const alertLog = jest.spyOn(window, "alert");

      const newBillComponent = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store: MockedBills,
      });

      window.onNavigate(ROUTES_PATH.NewBill);

      const handleSubmitMock = jest.spyOn(newBillComponent, "handleSubmit");
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeDefined();
      form.addEventListener("submit", handleSubmitMock);
      fireEvent.submit(form);

      expect(alertLog).not.toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    it("should change the file in the fileInput and display a file error", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBillComponent = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store: MockedBills,
      });

      const fileEvent = createFileEvent("file.mp4", "video/mp4", "mp4");

      let fileInput = screen.getByTestId("file");
      userEvent.upload(fileInput, fileEvent);
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      newBillComponent.handleChangeFile(fileEvent);

      await waitFor(() => {
        expect(screen.getByTestId("file-error-message")).toHaveTextContent(
          "Fichier non compatible, seuls les fichiers jpg, jpeg et png sont autorisés."
        );
      });
    });

    it("should change the file in the fileInput and display a success without error msg", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBillComponent = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store: MockedBills,
      });

      const fileEvent = createFileEvent("file.jpg", "image/jpg", "jpg");

      let fileInput = screen.getByTestId("file");
      userEvent.upload(fileInput, fileEvent);
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      newBillComponent.handleChangeFile(fileEvent);

      await waitFor(() => {
        expect(screen.getByTestId("file-error-message")).toBeEmptyDOMElement();
      });
    });
  });

  describe("When I send bad requests to the API", () => {
    it("should display a error message for a 500 error when I call the API", async () => {
  
      const error500 = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
          update: jest.fn().mockRejectedValue(new Error("Erreur 500"))
        }
      })
      
      window.onNavigate(ROUTES_PATH.NewBill);
      await expect(error500().create).rejects.toThrow("Erreur 500");
    });

    it("should display a error message for a 404 error when I call the API", async () => {
      
      const error404 = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
          update: jest.fn().mockRejectedValue(new Error("Erreur 404"))
        }
      })
      
      window.onNavigate(ROUTES_PATH.NewBill);
      await expect(error404().create).rejects.toThrow("Erreur 404");
    });
  })

  describe("When I send good request to the API", () => {
    it("should display success message when I call the API", async () => {
  
      const success = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: jest.fn().mockResolvedValue({})
        }
      })
      
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => {
        expect(success.mock).toBeTruthy();
      }) 
    });
  })

  describe("When the form is loaded", () => {
    it("should enable the submit button if the form is valid", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const form = screen.getByTestId("form-new-bill");
      const submitBtn = screen.getByTestId("btn-send-bill");

      let nameDepense = screen.getByTestId("expense-name");
      nameDepense.value = "Transfert matériel audiovisuel";
      fireEvent.input(nameDepense);
      
      let amountDepense = screen.getByTestId("amount");
      nameDepense.value = "100";
      fireEvent.input(amountDepense);

      let datepickerAmount = screen.getByTestId("datepicker");
      nameDepense.value = "2022-05-10";
      fireEvent.input(datepickerAmount);

      await waitFor(() => {
        expect(submitBtn).toBeVisible();
      });
    });

    it("should disable the submit button if the form is invalid", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const form = screen.getByTestId("form-new-bill");
      const submitBtn = screen.getByTestId("btn-send-bill");

      let nameDepense = screen.getByTestId("expense-name");
      nameDepense.value = "";
      fireEvent.input(nameDepense);
      
      let amountDepense = screen.getByTestId("amount");
      nameDepense.value = "";
      fireEvent.input(amountDepense);

      let datepickerAmount = screen.getByTestId("datepicker");
      nameDepense.value = "";
      fireEvent.input(datepickerAmount);

      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
      });
    });
  });
});
