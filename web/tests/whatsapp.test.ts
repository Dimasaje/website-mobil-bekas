import { describe, expect, it } from "bun:test";
import { FloatingCTA } from "../src/components/common/FloatingCTA";
import { Footer } from "../src/components/layout/Footer";
import {
  buildWhatsAppLink,
  formatWhatsAppNumber,
  getWhatsAppMessage,
} from "../src/lib/whatsapp";

describe("WhatsApp Utilities & Floating CTA (T-19)", () => {
  describe("formatWhatsAppNumber", () => {
    it("converts local 08xx to international 628xx", () => {
      expect(formatWhatsAppNumber("081234567890")).toBe("6281234567890");
      expect(formatWhatsAppNumber("0812-9876-5432")).toBe("6281298765432");
      expect(formatWhatsAppNumber("+62 812-9876-5432")).toBe("6281298765432");
    });

    it("keeps already international format 62xxx", () => {
      expect(formatWhatsAppNumber("6281298765432")).toBe("6281298765432");
    });

    it("falls back to default number if empty or null", () => {
      expect(formatWhatsAppNumber("")).toBe("6281298765432");
      expect(formatWhatsAppNumber(null)).toBe("6281298765432");
    });
  });

  describe("getWhatsAppMessage", () => {
    it("generates general inquiry message", () => {
      const msg = getWhatsAppMessage("general", {
        showroomName: "Bintang Mobil",
      });
      expect(msg).toContain("Bintang Mobil");
      expect(msg).toContain("seputar stok mobil bekas");
    });

    it("generates specific car inquiry message with formatted price", () => {
      const msg = getWhatsAppMessage("car", {
        showroomName: "Bintang Mobil",
        carTitle: "Toyota Avanza 1.3 G 2020",
        price: 178000000,
      });
      expect(msg).toContain("Toyota Avanza 1.3 G 2020");
      expect(msg).toContain("Rp 178.000.000");
      expect(msg).toContain("test drive");
    });

    it("generates credit simulation consultation message", () => {
      const msg = getWhatsAppMessage("simulation", {
        showroomName: "Bintang Mobil",
        carTitle: "Honda Brio RS 2021",
        dp: 25000000,
        tenor: 48,
        installment: 3200000,
      });
      expect(msg).toContain(
        "simulasi pembiayaan kredit untuk unit Honda Brio RS 2021",
      );
      expect(msg).toContain("DP: Rp 25.000.000");
      expect(msg).toContain("Tenor: 48 bulan");
      expect(msg).toContain("Rp 3.200.000/bulan");
    });

    it("generates trade-in message", () => {
      const msg = getWhatsAppMessage("tradeIn", {
        showroomName: "Bintang Mobil",
        oldCar: "Daihatsu Xenia 2015",
        targetCar: "Mitsubishi Pajero Sport 2019",
      });
      expect(msg).toContain("mobil lama saya (Daihatsu Xenia 2015)");
      expect(msg).toContain("unit Mitsubishi Pajero Sport 2019");
      expect(msg).toContain("estimasi harga appraisal");
    });

    it("generates test drive booking message", () => {
      const msg = getWhatsAppMessage("testDrive", {
        showroomName: "Bintang Mobil",
        carTitle: "Honda HR-V 2019",
      });
      expect(msg).toContain("menjadwalkan test drive untuk Honda HR-V 2019");
    });

    it("uses custom message if provided", () => {
      const msg = getWhatsAppMessage("general", {
        customMessage: "Pesan khusus yang saya buat sendiri.",
      });
      expect(msg).toBe("Pesan khusus yang saya buat sendiri.");
    });
  });

  describe("buildWhatsAppLink", () => {
    it("builds valid wa.me url with encoded message and cleaned phone", () => {
      const url = buildWhatsAppLink({
        phoneNumber: "0812-9876-5432",
        showroomName: "Bintang Mobil",
        context: "car",
        params: {
          carTitle: "Suzuki Ertiga 2018",
          price: 155000000,
        },
      });

      expect(url.startsWith("https://wa.me/6281298765432?text=")).toBe(true);
      const textParam = new URL(url).searchParams.get("text") || "";
      expect(textParam).toContain("Suzuki Ertiga 2018");
      expect(textParam).toContain("Rp 155.000.000");
    });
  });

  describe("FloatingCTA Component", () => {
    it("renders quick contact buttons with proper hrefs and accessible labels", () => {
      const cta = FloatingCTA({
        whatsappNumber: "0812-9876-5432",
        phoneNumber: "021-87654321",
        showroomName: "Bintang Mobil",
      });

      expect(cta.type).toBe("aside");
      expect(cta.props["aria-label"]).toBe("Kontak Cepat Showroom");
      expect(cta.props.className).toContain("fixed");
      expect(cta.props.className).toContain("bottom-4");
      expect(cta.props.className).toContain("right-4");

      const children = cta.props.children;
      expect(children.length).toBe(2);

      // Phone link
      const phoneLink = children[0];
      expect(phoneLink.props.href).toBe("tel:02187654321");
      expect(phoneLink.props.className).toContain("min-h-[48px]");

      // WhatsApp link
      const waLink = children[1];
      expect(waLink.props.href).toContain("https://wa.me/6281298765432");
      expect(waLink.props.target).toBe("_blank");
      expect(waLink.props.className).toContain("min-h-[48px]");
    });

    it("verifies dynamic phone number from settings is honored in car context", () => {
      const url = buildWhatsAppLink({
        phoneNumber: "628111222333",
        showroomName: "Bintang Mobil",
        context: "car",
        params: { carTitle: "Avanza", price: 178000000 },
      });
      expect(url.startsWith("https://wa.me/628111222333?text=")).toBe(true);
    });

    it("verifies Footer has adequate mobile bottom padding to prevent CTA overlap", () => {
      const footer = Footer({});
      expect(footer.props.className).toContain("pb-32");
      expect(footer.props.className).toContain("md:pb-8");
    });
  });
});
