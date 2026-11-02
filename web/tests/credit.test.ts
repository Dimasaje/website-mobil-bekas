import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { calculateCredit, CreditPage } from "../src/pages/CreditPage";

describe("CreditPage & calculateCredit (T-23)", () => {
  it("calculates credit installment accurately with flat rate formula", () => {
    // Harga 100 Jt, DP 20 Jt (Pokok 80 Jt), Tenor 12 bulan, Bunga 10%
    const res = calculateCredit({
      price: 100000000,
      dpAmount: 20000000,
      tenorMonths: 12,
      annualInterestRate: 10,
    });

    expect(res.principalLoan).toBe(80000000);
    expect(res.totalInterest).toBe(8000000);
    expect(res.totalLoan).toBe(88000000);
    expect(res.monthlyInstallment).toBe(Math.round(88000000 / 12));
  });

  it("calculates 4-year credit correctly", () => {
    // Harga 200 Jt, DP 40 Jt (Pokok 160 Jt), Tenor 48 bulan (4 tahun), Bunga 8.5%
    const res = calculateCredit({
      price: 200000000,
      dpAmount: 40000000,
      tenorMonths: 48,
      annualInterestRate: 8.5,
    });

    expect(res.principalLoan).toBe(160000000);
    // Bunga 4 tahun = 160.000.000 * 0.085 * 4 = 54.400.000
    expect(res.totalInterest).toBe(54400000);
    expect(res.totalLoan).toBe(214400000);
    expect(res.monthlyInstallment).toBe(Math.round(214400000 / 48));
  });

  it("handles edge cases (zero price or full DP)", () => {
    const resZero = calculateCredit({
      price: 0,
      dpAmount: 0,
      tenorMonths: 12,
      annualInterestRate: 8.5,
    });
    expect(resZero.principalLoan).toBe(0);
    expect(resZero.monthlyInstallment).toBe(0);

    const resFullDp = calculateCredit({
      price: 150000000,
      dpAmount: 150000000,
      tenorMonths: 24,
      annualInterestRate: 8.5,
    });
    expect(resFullDp.principalLoan).toBe(0);
    expect(resFullDp.monthlyInstallment).toBe(0);
  });

  it("renders CreditPage component with disclaimer and estimation label", () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            "/simulasi-kredit?price=250000000&car=Toyota+Innova",
          ],
        },
        React.createElement(CreditPage),
      ),
    );

    expect(html).toContain("Kalkulator Simulasi Kredit");
    expect(html).toContain("Toyota Innova");
    expect(html).toContain("HASIL ESTIMASI SEMENTARA");
    expect(html).toContain("DISCLAIMER");
    expect(html).toContain("Kirim Hasil Simulasi ke WhatsApp");
  });
});
