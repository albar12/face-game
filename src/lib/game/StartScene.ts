import Phaser from "phaser";

export default class StartScene extends Phaser.Scene {
    constructor() {
        super("StartScene");
    }

    preload() {
        this.load.image("curtain_left", "/src/lib/assets/img_curtain_background_left.png");
        this.load.image("curtain_right", "/src/lib/assets/img_curtain_background_right.png");
        this.load.image("curtain_full", "/src/lib/assets/img_curtain_background.png");
        this.load.image("bg_stage", "/src/lib/assets/img_background.png");
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;

        // 1. Background Panggung
        this.add.image(centerX, height / 2, "bg_stage").setDisplaySize(width, height);

        // 2. Gorden (Kiri & Kanan)
        const curtainLeft = this.add.image(centerX, height / 2, "curtain_left")
            .setOrigin(1, 0.5)
            .setDisplaySize(width / 2, height)
            .setDepth(10);

        const curtainRight = this.add.image(centerX, height / 2, "curtain_right")
            .setOrigin(0, 0.5)
            .setDisplaySize(width / 2, height)
            .setDepth(10);

        // 3. Teks Instruksi "KLIK UNTUK MULAI"
        const startText = this.add.text(centerX, height * 0.75, "— Click For Start —", {
            fontFamily: "Georgia, serif", // Gunakan font yang elegan
            fontSize: "42px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#8B0000", // Outline merah tua agar kontras dengan gorden
            strokeThickness: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
        })
            .setOrigin(0.5)
            .setDepth(20);

        // 4. Animasi Pulsing pada Teks (Memudar masuk dan keluar)
        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 }, // Efek kedip transparan
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 5. Logika Klik
        this.input.once("pointerdown", () => {
            // Hapus teks saat diklik
            startText.destroy();

            // Animasi Gorden Terbuka
            this.tweens.add({
                targets: curtainLeft,
                x: 0,
                duration: 1500,
                ease: "Cubic.easeInOut"
            });

            this.tweens.add({
                targets: curtainRight,
                x: width,
                duration: 1500,
                ease: "Cubic.easeInOut",
                onComplete: () => {
                    this.scene.start("GameScene");
                }
            });
        });
    }
}