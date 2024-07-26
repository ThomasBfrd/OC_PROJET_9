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
import MockedBills from "../__mocks__/store";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    jest.mock("../app/store", () => mockStore);
    jest.mock("../app/store", () => MockedBills);

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

      router();

      const html = BillsUI({ data: bills });

      root.innerHTML = html;
    });

    afterEach(() => {
      const root = document.querySelector("#root");
      if (root) {
        document.body.removeChild(root);
      }
    });

    describe("When I come on the Bills page", () => {
      test("Then I should see all the bills", async () => {
        router.currentPath = ROUTES_PATH.Bills;

        const billsComponent = new Bills({
          document,
          localStorage: window.localStorage,
          onNavigate,
          store: mockStore,
        });

        billsComponent.getBills();
        expect(billsComponent.store).not.toBeNull();
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

      test("Then i should be able to open a bill with the icon eye", async () => {
        router.currentPath = ROUTES_PATH.Bills;

        const newBill = new Bills({
          document,
          localStorage: window.localStorage,
          onNavigate,
          store: mockStore,
        });

        const eyeIcons = screen.getAllByTestId("icon-eye");
        $.fn.modal = jest.fn();
        const handleClickIconEye = jest.fn((e) =>
          newBill.handleClickIconEye(e)
        );

        newBill.getBills();

        eyeIcons.forEach((icon) => {
          icon.addEventListener("click", handleClickIconEye(icon));
          userEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
        });
      });
    });

    describe("When I come to the Bills page and store not found", () => {
      test("Then I shouldn`t see the bills because of no store found", async () => {
        router.currentPath = ROUTES_PATH.Bills;

        const billsComponent = new Bills({
          document,
          localStorage: window.localStorage,
          onNavigate,
          store: null,
        });

        billsComponent.getBills();
        expect(billsComponent.store).toBeNull();
      });
    });

    describe("When I want to create a new bill", () => {
      test("Then I should click on the new bill button", async () => {
        router.currentPath = ROUTES_PATH.Bills;

        const bills = new Bills({
          document,
          localStorage: window.localStorage,
          onNavigate,
          store: mockStore,
        });

        const btnNewBill = await waitFor(() =>
          screen.getByTestId("btn-new-bill")
        );

        btnNewBill.addEventListener("click", bills.handleClickNewBill());
        userEvent.click(btnNewBill);

        window.onNavigate(ROUTES_PATH["NewBill"]);
        router.currentPath = ROUTES_PATH.NewBill;

        expect(btnNewBill).not.toBeNull();
        expect(router.currentPath).toBe(ROUTES_PATH.NewBill);
      });
    });
  });
});
