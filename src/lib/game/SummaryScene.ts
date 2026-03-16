import Phaser from "phaser";

export default class SummaryScene extends Phaser.Scene {
    constructor() {
        super("SummaryScene");
    }

    preload() {
        this.load.image("curtain_full", "/src/lib/assets/img_curtain_background.png");
    }

    // Menerima data dari scene sebelumnya
    create(data: any) {
        const { width, height } = this.scale;
        const centerX = width / 2;

        // 1. Background (Gunakan gambar gorden/curtain jika ada)
        const bg = this.add.image(width / 2, height / 2, "curtain_full");
        bg.setDisplaySize(width, height).setTint(0x999999); // Gelapkan sedikit

        // 2. Konfigurasi Gaya Teks
        const labelStyle = {
            fontFamily: '"Permanent Marker"',
            fontSize: "60px",
            color: "#ffffff",
            fontStyle: "bold"
        };

        const valueStyle = {
            fontFamily: '"Permanent Marker"',
            fontSize: "70px",
            color: "#ffffff",
            fontStyle: "bold"
        };

        // 3. Menampilkan Statistik (Gaya List)
        const startX = width / 2 - 200;
        const startY = height / 2 - 250;
        const spacing = 100;

        const statsEntries = [
            { label: "Skor", value: data.totalScore },
            { label: "Perfect", value: data.perfect },
            { label: "Great", value: data.great },
            { label: "Good", value: data.good },
            { label: "Miss", value: data.miss },
        ];

        statsEntries.forEach((entry, index) => {
            const yPos = startY + (index * spacing);

            // Label di sisi kiri
            this.add.text(startX, yPos, entry.label, labelStyle).setOrigin(0, 0.5);

            // Nilai di sisi kanan
            this.add.text(startX + 450, yPos, entry.value.toString(), valueStyle).setOrigin(1, 0.5);
        });

        // 4. Tombol Kembali/Restart
        const restartBtn = this.add.text(width / 2, height - 150, "Play Again", {
            fontSize: "40px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.scene.start("StartScene"));

        // Efek masuk (Fade In)
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
}