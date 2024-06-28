/**
 * @jest-environment jsdom
 */

import { screen, waitFor, getByTestId } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    jest.mock("../app/store", () => mockStore);

    beforeEach(() => {
      
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router()

      const html = BillsUI({data: bills});

      root.innerHTML = html;
    });

    afterEach(() => {
      const root = document.querySelector("#root");
      if (root) {
        document.body.removeChild(root);
      }
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {


      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      ////////////////////////////////
      expect(windowIcon).toBeDefined();
      expect(windowIcon.className).toContain("active-icon");
      ////////////////////////////////
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);

      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });

    test("Then I should able to open the new-bill page", () => {

      router.currentPath = ROUTES_PATH.Bills;

      userEvent.click(getByTestId(document.body, "btn-new-bill"));

      router.currentPath = ROUTES_PATH.NewBill;
      const store = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const handleClickNewBill = jest.fn(newBill.onNavigate);

      expect(handleClickNewBill).toBeDefined();
      expect(router.currentPath).toBe(ROUTES_PATH.NewBill);
    });

    test('Then a modal appears', async () => {

      router.currentPath = ROUTES_PATH.Bills;

      const billsInitialization = new Bills({
        document, 
        localStorage: window.localStorage,
        onNavigate,
        store: null
      })

      const handleClickIconEye = jest.fn(e => billsInitialization.handleClickIconEye(e))
      
      const eyeIcons = screen.getAllByTestId('icon-eye')

      $.fn.modal = jest.fn();

      eyeIcons.forEach((icon) => {
      icon.addEventListener('click', handleClickIconEye(icon))
      userEvent.click(icon)
      expect(handleClickIconEye).toHaveBeenCalled()
      })
    })
  });
});
