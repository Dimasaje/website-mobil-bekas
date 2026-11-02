import { SQL } from "bun";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { DATABASE_URL } from "./env";
import * as schema from "./schema";

const client = new SQL(DATABASE_URL);
const db = drizzle({ client, schema });

export async function runSeed() {
  console.log("🌱 Menjalankan seed data...");

  // 1. Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bintangmobil.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const adminName = process.env.ADMIN_NAME || "Admin Bintang Mobil";

  const existingAdmin = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, adminEmail))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await Bun.password.hash(adminPassword);
    await db.insert(schema.adminUsers).values({
      name: adminName,
      email: adminEmail,
      passwordHash,
    });
    console.log(`✅ Admin dibuat: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Admin ${adminEmail} sudah ada.`);
  }

  // 2. Site Settings
  await db
    .insert(schema.siteSettings)
    .values({
      id: "default",
      showroomName: "Bintang Mobil",
      whatsappNumber: "6281298765432",
      phoneNumber: "021-87654321",
      address:
        "Jl. Raya Otista No. 123, Bidara Cina, Jatinegara, Jakarta Timur",
      mapsUrl: "https://maps.google.com/?q=Jakarta+Timur",
      openingHours: "Senin - Minggu: 08:30 - 18:00 WIB",
      heroTitle: "Temukan Mobil Bekas Impian Anda",
      heroSubtitle:
        "Pilihan terlengkap, kondisi prima terjamin, bebas banjir dan tabrak.",
      defaultInterestRate: "8.50",
      minDownPaymentPercent: "20.00",
    })
    .onConflictDoNothing();
  console.log("✅ Pengaturan situs default siap.");

  // 3. Brands
  const initialBrands = [
    { name: "Toyota", slug: "toyota" },
    { name: "Honda", slug: "honda" },
    { name: "Daihatsu", slug: "daihatsu" },
    { name: "Mitsubishi", slug: "mitsubishi" },
    { name: "Suzuki", slug: "suzuki" },
    { name: "Nissan", slug: "nissan" },
    { name: "Hyundai", slug: "hyundai" },
    { name: "Mazda", slug: "mazda" },
  ];

  for (const b of initialBrands) {
    await db.insert(schema.brands).values(b).onConflictDoNothing();
  }
  console.log("✅ Merek kendaraan umum siap.");

  const allBrands = await db.select().from(schema.brands);
  const brandMap = new Map(allBrands.map((b) => [b.slug, b.id]));

  // 4. Cars & Photos (+- 10 mobil contoh)
  const sampleCars = [
    {
      title: "Toyota Avanza 1.3 G Manual 2020",
      slug: "toyota-avanza-13-g-manual-2020",
      brandSlug: "toyota",
      model: "Avanza 1.3 G",
      year: 2020,
      price: 178000000,
      transmission: "manual",
      mileage: 45000,
      fuelType: "bensin",
      engineCapacity: 1300,
      color: "Silver Metalik",
      licensePlate: "B 1234 KAA",
      stnkValidUntil: new Date("2027-04-15"),
      description:
        "Kondisi mulus terawat, service record bengkel resmi Toyota, interior bersih bebas asap rokok, ban masih tebal 85%, jaminan bebas banjir & tabrak.",
      features: [
        "AC Double Blower",
        "Dual SRS Airbag",
        "Audio Touchscreen",
        "Sensor Parkir",
        "Power Window",
      ],
      status: "tersedia",
      isFeatured: true,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
        {
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
          isPrimary: false,
          order: 1,
        },
      ],
    },
    {
      title: "Honda Brio 1.2 RS CVT 2021",
      slug: "honda-brio-12-rs-cvt-2021",
      brandSlug: "honda",
      model: "Brio RS",
      year: 2021,
      price: 168000000,
      transmission: "matic",
      mileage: 32000,
      fuelType: "bensin",
      engineCapacity: 1200,
      color: "Kuning Carnation",
      licensePlate: "B 2345 SBB",
      stnkValidUntil: new Date("2027-08-20"),
      description:
        "Tipe tertinggi RS, bodi orisinil pabrik, mesin responsif irit bahan bakar, surat lengkap tangan pertama dari baru.",
      features: [
        "Velg Two Tone R15",
        "Keyless Entry",
        "Steering Switch Control",
        "Retractable Mirror",
        "Layar Sentuh 6.2 Inch",
      ],
      status: "tersedia",
      isFeatured: true,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Mitsubishi Pajero Sport 2.4 Dakar 4x2 2019",
      slug: "mitsubishi-pajero-sport-24-dakar-2019",
      brandSlug: "mitsubishi",
      model: "Pajero Sport Dakar",
      year: 2019,
      price: 435000000,
      transmission: "matic",
      mileage: 68000,
      fuelType: "diesel",
      engineCapacity: 2400,
      color: "Hitam Metalik",
      licensePlate: "B 9999 DKR",
      stnkValidUntil: new Date("2027-11-10"),
      description:
        "Varian Dakar terfavorit, mesin diesel bertenaga & tangguh, sunroof aktif, interior jok kulit asli, siap luar kota.",
      features: [
        "Sunroof",
        "Leather Seat",
        "Paddle Shift",
        "Cruise Control",
        "Kamera Parkir",
      ],
      status: "tersedia",
      isFeatured: true,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Toyota Innova Reborn 2.4 V Diesel Matic 2018",
      slug: "toyota-innova-reborn-24-v-diesel-matic-2018",
      brandSlug: "toyota",
      model: "Innova Reborn 2.4 V",
      year: 2018,
      price: 345000000,
      transmission: "matic",
      mileage: 82000,
      fuelType: "diesel",
      engineCapacity: 2400,
      color: "Putih Mutiara",
      licensePlate: "B 1888 INV",
      stnkValidUntil: new Date("2027-02-18"),
      description:
        "Kenyamanan MPV keluarga terbaik, tipe V elegan dengan ambient light, mesin 2GD diesel irit dan bertenaga.",
      features: [
        "Ambient Light Plafon",
        "AC Digital Auto",
        "Captain Seat Row 2",
        "Rear Seat Entertainment",
      ],
      status: "booking",
      isFeatured: false,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Daihatsu Terios 1.5 R Deluxe Manual 2019",
      slug: "daihatsu-terios-15-r-deluxe-manual-2019",
      brandSlug: "daihatsu",
      model: "Terios 1.5 R Deluxe",
      year: 2019,
      price: 185000000,
      transmission: "manual",
      mileage: 51000,
      fuelType: "bensin",
      engineCapacity: 1500,
      color: "Bronze Metallic",
      licensePlate: "F 1420 TRS",
      stnkValidUntil: new Date("2027-05-12"),
      description:
        "SUV 7-penumpang dengan ground clearance tinggi, cocok untuk jalanan luar kota maupun perkotaan.",
      features: [
        "Kamera 360 Derajat",
        "Push Start Button",
        "Hill Start Assist",
        "Digital AC",
      ],
      status: "tersedia",
      isFeatured: false,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Suzuki Ertiga 1.5 GX Matic 2020",
      slug: "suzuki-ertiga-15-gx-matic-2020",
      brandSlug: "suzuki",
      model: "Ertiga GX",
      year: 2020,
      price: 182000000,
      transmission: "matic",
      mileage: 48000,
      fuelType: "bensin",
      engineCapacity: 1500,
      color: "Abu-abu Metalik",
      licensePlate: "B 1567 ERT",
      stnkValidUntil: new Date("2027-09-05"),
      description:
        "Kabin lapang, bantingan suspensi sangat empuk dan nyaman, wood panel interior berkelas.",
      features: [
        "Smart Entry & Push Start",
        "Wood Panel Interior",
        "Ventilated Cup Holder",
        "Electronic Stability Programme",
      ],
      status: "tersedia",
      isFeatured: false,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Honda HR-V 1.5 E Special Edition 2019",
      slug: "honda-hr-v-15-e-special-edition-2019",
      brandSlug: "honda",
      model: "HR-V 1.5 E SE",
      year: 2019,
      price: 245000000,
      transmission: "matic",
      mileage: 55000,
      fuelType: "bensin",
      engineCapacity: 1500,
      color: "Modern Steel Metallic",
      licensePlate: "D 1789 HRV",
      stnkValidUntil: new Date("2027-06-25"),
      description:
        "Desain sporty berkarakter, lampu Full LED, jok kombinasi kulit asli, rem parkir elektrik dengan Auto Brake Hold.",
      features: [
        "Full LED Headlight",
        "Electric Parking Brake",
        "Auto Brake Hold",
        "Paddle Shift",
      ],
      status: "tersedia",
      isFeatured: true,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Toyota Fortuner 2.4 VRZ Matic 2017",
      slug: "toyota-fortuner-24-vrz-matic-2017",
      brandSlug: "toyota",
      model: "Fortuner 2.4 VRZ",
      year: 2017,
      price: 360000000,
      transmission: "matic",
      mileage: 95000,
      fuelType: "diesel",
      engineCapacity: 2400,
      color: "Phantom Brown",
      licensePlate: "B 1472 FTN",
      stnkValidUntil: new Date("2027-03-30"),
      description:
        "SUV ladder frame tangguh, power back door, paddle shift, riwayat servis resmi rutin, bebas banjir.",
      features: [
        "Power Back Door",
        "Bi-Beam LED Headlamp",
        "Drive Mode (Eco/Power)",
        "Leather Seat",
      ],
      status: "terjual",
      isFeatured: false,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Nissan Serena 2.0 HWS Autech 2016",
      slug: "nissan-serena-20-hws-autech-2016",
      brandSlug: "nissan",
      model: "Serena HWS Autech",
      year: 2016,
      price: 195000000,
      transmission: "matic",
      mileage: 87000,
      fuelType: "bensin",
      engineCapacity: 2000,
      color: "Hitam",
      licensePlate: "B 2981 SRN",
      stnkValidUntil: new Date("2027-07-14"),
      description:
        "High roof MPV super nyaman untuk keluarga, sliding door elektrik kanan-kiri, kursi baris kedua captain seat fleksibel.",
      features: [
        "Dual Power Sliding Door",
        "Cruise Control",
        "Roof Monitor",
        "Captain Seat",
      ],
      status: "tersedia",
      isFeatured: false,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
    {
      title: "Hyundai Creta 1.5 Prime IVT 2022",
      slug: "hyundai-creta-15-prime-ivt-2022",
      brandSlug: "hyundai",
      model: "Creta Prime",
      year: 2022,
      price: 285000000,
      transmission: "matic",
      mileage: 26000,
      fuelType: "bensin",
      engineCapacity: 1500,
      color: "Magnetic Silver Two Tone",
      licensePlate: "B 2022 CRT",
      stnkValidUntil: new Date("2027-10-08"),
      description:
        "Varian tertinggi Prime with Bluelink, panoramic sunroof, audio premium BOSE 8-speaker, fitur keselamatan Hyundai SmartSense lengkap.",
      features: [
        "Panoramic Sunroof",
        "BOSE Sound System",
        "Ventilated Seats",
        "Hyundai SmartSense ADAS",
        "Wireless Charger",
      ],
      status: "tersedia",
      isFeatured: true,
      photos: [
        {
          url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80",
          isPrimary: true,
          order: 0,
        },
      ],
    },
  ];

  for (const item of sampleCars) {
    const brandId = brandMap.get(item.brandSlug);
    if (!brandId) continue;

    const existingCar = await db
      .select({ id: schema.cars.id })
      .from(schema.cars)
      .where(eq(schema.cars.slug, item.slug))
      .limit(1);

    let carId: string;
    if (existingCar.length === 0) {
      const [inserted] = await db
        .insert(schema.cars)
        .values({
          brandId,
          title: item.title,
          slug: item.slug,
          model: item.model,
          year: item.year,
          price: item.price,
          transmission: item.transmission,
          mileage: item.mileage,
          fuelType: item.fuelType,
          engineCapacity: item.engineCapacity,
          color: item.color,
          licensePlate: item.licensePlate,
          stnkValidUntil: item.stnkValidUntil,
          description: item.description,
          features: item.features,
          status: item.status,
          isFeatured: item.isFeatured,
        })
        .returning({ id: schema.cars.id });
      carId = inserted.id;

      for (const p of item.photos) {
        await db.insert(schema.carPhotos).values({
          carId,
          url: p.url,
          isPrimary: p.isPrimary,
          order: p.order,
        });
      }
    }
  }
  console.log("✅ 10 mobil contoh dan foto siap.");

  // 5. Testimonials
  const initialTestimonials = [
    {
      customerName: "Pak Hendra",
      location: "Jakarta Barat",
      carName: "Toyota Avanza 2020",
      rating: 5,
      quote:
        "Awalnya ragu beli mobil bekas, tapi dijelaskan transparan semua hasil inspeksinya. Pas dicek di bengkel resmi langganan saya, mekaniknya bilang kondisi mobil istimewa dan bebas banjir. Terima kasih Bintang Mobil!",
    },
    {
      customerName: "Ibu Siska",
      location: "Depok",
      carName: "Honda Brio RS 2021",
      rating: 5,
      quote:
        "Proses kredit dibantu sampai tuntas hanya dalam 2 hari kerja. Uang muka ringan dan angsuran sesuai simulasi di website. Mobil sampai rumah kinclong dan bersih banget!",
    },
    {
      customerName: "Pak Doni",
      location: "Tangerang",
      carName: "Toyota Innova Reborn 2018",
      rating: 5,
      quote:
        "Tukar tambah mobil lama saya dihargai sangat wajar, jauh lebih tinggi dari tawaran tempat lain. Nggak ribet, langsung potong DP untuk bawa pulang Innova Reborn.",
    },
  ];

  for (const t of initialTestimonials) {
    const existing = await db
      .select({ id: schema.testimonials.id })
      .from(schema.testimonials)
      .where(eq(schema.testimonials.customerName, t.customerName))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.testimonials).values(t);
    }
  }
  console.log("✅ Testimoni pelanggan siap.");

  // 6. Promos
  const initialPromos = [
    {
      title: "Promo DP Ringan Mulai 15% Bulan Ini",
      slug: "promo-dp-ringan-15-persen",
      description:
        "Dapatkan bunga spesial 7.9% dan tenor hingga 5 tahun untuk unit bertanda khusus.",
      isActive: true,
    },
  ];

  for (const pr of initialPromos) {
    const existing = await db
      .select({ id: schema.promos.id })
      .from(schema.promos)
      .where(eq(schema.promos.slug, pr.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.promos).values(pr);
    }
  }
  console.log("✅ Promo siap.");

  // 7. Articles
  const initialArticles = [
    {
      title: "Tips Cek Mobil Bekas Bebas Banjir dan Tabrak",
      slug: "tips-cek-mobil-bekas-bebas-banjir-tabrak",
      content:
        "Membeli mobil bekas memerlukan ketelitian tinggi. Periksa baut-baut bodi, apakah ada bekas las ulang. Cek bagian bawah karpet dan rel jok untuk memastikan tidak ada endapan lumpur atau karat mencurigakan.",
      status: "terbit",
      publishedAt: new Date("2026-10-15"),
    },
    {
      title: "Panduan Simulasi Kredit dan Menghitung Angsuran Mobil Bekas",
      slug: "panduan-simulasi-kredit-menghitung-angsuran-mobil-bekas",
      content:
        "Ketahui perbandingan DP dan tenor sebelum mengajukan pembiayaan kredit. Pastikan angsuran bulanan tidak melebihi 30% dari total pendapatan bulanan keluarga Anda.",
      status: "terbit",
      publishedAt: new Date("2026-10-20"),
    },
  ];

  for (const a of initialArticles) {
    const existing = await db
      .select({ id: schema.articles.id })
      .from(schema.articles)
      .where(eq(schema.articles.slug, a.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.articles).values(a);
    }
  }
  console.log("✅ Artikel tips siap.");

  console.log("✨ Seed selesai dengan sukses!");
}

if (import.meta.main) {
  runSeed()
    .then(async () => {
      await client.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Gagal menjalankan seed:", err);
      await client.close();
      process.exit(1);
    });
}
