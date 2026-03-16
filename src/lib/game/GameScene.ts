import Phaser from "phaser"
import ProgressBar from "../ui/ProgressBar"
import FeedbackText from "../ui/FeedbackText"
import ComboSystem from "../systems/ComboSystem"

export default class GameScene extends Phaser.Scene {

    masks = ["mask1", "mask2", "mask3", "mask4"]

    point: integer[] = []

    perfectPoint: integer[] = []
    greatPoint: integer[] = []
    goodPoint: integer[] = []
    missPoint: integer[] = []
    maxComboPoint: integer[] = []

    targetMask!: Phaser.GameObjects.Image
    centerMask!: Phaser.GameObjects.Image
    comboText!: Phaser.GameObjects.Text
    comboText2!: Phaser.GameObjects.Text
    items!: Phaser.GameObjects.Image[]
    gap = 220

    shuffleTimer?: Phaser.Time.TimerEvent

    targetIndex = 0
    currentIndex = 0
    carouselIndex = 0

    progressBar!: ProgressBar
    feedback!: FeedbackText
    comboSystem = new ComboSystem()

    timeLeft = 5000

    isTimeout = false;
    isMoving = false;

    constructor() {
        super("GameScene")
    }

    preload() {

        this.load.image("mask1", "/src/lib/assets/masks/mask1.png")
        this.load.image("mask2", "/src/lib/assets/masks/mask2.png")
        this.load.image("mask3", "/src/lib/assets/masks/mask3.png")
        this.load.image("mask4", "/src/lib/assets/masks/mask4.png")
        this.load.image(
            "bg",
            "/src/lib/assets/img_background.png"
        )

    }

    create() {
        const { width, height } = this.scale

        const bg = this.add.image(
            width / 2,
            height / 2,
            "bg"
        )

        bg.setDisplaySize(width, height)

        // lingkaran putih kiri
        const circle = this.add.circle(
            300,     // x
            380,     // y
            120,     // radius
            0xffffff // warna putih
        )

        // lingkaran putih tengah
        const circle2 = this.add.circle(
            970,     // x
            510,     // y
            280,     // radius
            0xffffff // warna putih
        )

        this.createUI()

        // mulai game
        this.startRound()

        // tombol SPACE
        this.input.keyboard?.on("keydown-SPACE", () => {

            this.stopShuffle()

        })

    }

    createUI() {

        // target mask kiri
        this.targetMask = this.add.image(
            300,
            380,
            "mask1"
        ).setScale(0.53)

        // mask besar di tengah
        // this.centerMask = this.add.image(
        //     970,
        //     515,
        //     "mask1"
        // ).setScale(1.23)

        // text combo
        this.comboText = this.add.text(1630, 140, "", {
            fontFamily: "Arial",
            fontSize: "80px",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 6,
            align: "center"
        }).setOrigin(0.5)

        this.comboText2 = this.add.text(1610, 240, "", {
            fontFamily: "Arial",
            fontSize: "70px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5)

        this.comboText.setShadow(2, 2, "#000000", 5)
        this.comboText2.setShadow(2, 2, "#000000", 5)

        this.progressBar = new ProgressBar(this);

        this.startTimer()

        this.createCarousel()

    }


    startRound() {
        const centerX = 970;
        const centerY = 515;
        const centerIndex = 2;

        // 1. Reset posisi semua item agar rapi kembali (Snap to Grid)
        this.items.forEach((item, i) => {
            // Hentikan semua animasi yang sedang berjalan pada item ini
            this.tweens.killTweensOf(item);

            // Kembalikan ke posisi Y yang seharusnya berdasarkan urutan index
            const targetY = centerY + (i - centerIndex) * this.gap;
            item.setY(targetY);

            // Reset visual agar yang di tengah besar, sisanya kecil
            const distance = Math.abs(targetY - 515);
            if (distance < 10) {
                item.setScale(1.23).setAlpha(1).setDepth(100);
                this.centerMask = item; // Pastikan referensi centerMask benar
            } else {
                item.setScale(0.6).setAlpha(0.3).setDepth(100 - distance);
            }
        });

        // 2. Pilih target baru secara acak
        this.targetIndex = Phaser.Math.Between(0, this.masks.length - 1);
        this.targetMask.setTexture(this.masks[this.targetIndex]);

        // 3. Pastikan status bergerak di-reset
        this.isMoving = false;

        // 4. Mulai shuffle kembali
        this.startShuffle();
    }

    startShuffle() {
        // Pastikan tidak ada timer lama yang tertinggal
        this.shuffleTimer?.remove(false);

        // Munculkan semua item
        this.items.forEach(item => {
            this.tweens.add({
                targets: item,
                alpha: 1,
                duration: 800
            });
        });

        // Jalankan pergerakan pertama
        this.moveCarousel();
    }

    moveCarousel() {
        // Jika game dihentikan (karena SPACE atau Timeout), jangan lanjut bergulir
        if (this.isTimeout) return;

        const topLimit = 515 - (this.gap * 3);
        const bottomLimit = 515 + (this.gap * 2);

        this.items.forEach((item) => {
            const targetY = item.y - this.gap;

            this.tweens.add({
                targets: item,
                y: targetY,
                duration: 1200, // Percepat durasi agar terlihat mengalir
                ease: "Linear", // Gunakan Linear agar tidak ada jeda percepatan/perlambatan
                onUpdate: () => {
                    const distance = Math.abs(item.y - 515);
                    const scaleBase = 1.23;
                    const dynamicScale = Math.max(0.6, scaleBase - (distance / 600));

                    item.setScale(dynamicScale);
                    item.setAlpha(Math.max(0.1, 1 - (distance / 600)));
                    item.setDepth(100 - distance);

                    // Selalu update referensi tengah secara real-time
                    this.updateCenterReference();
                },
                onComplete: () => {
                    // Logika Reset Posisi (Teleport)
                    if (item.y <= topLimit + 10) {
                        item.y = bottomLimit;

                        // Ganti tekstur secara bergantian
                        this.carouselIndex = (this.carouselIndex + 1) % this.masks.length;
                        item.setTexture(this.masks[this.carouselIndex]);
                    }

                    // Cek jika ini adalah item terakhir yang selesai bergerak
                    // Maka panggil moveCarousel lagi untuk pergerakan berikutnya (Looping)
                    if (item === this.items[this.items.length - 1] && !this.isMoving) {
                        // Beri sedikit jeda atau langsung panggil lagi
                        this.time.delayedCall(10, () => this.moveCarousel());
                    }
                }
            });
        });
    }

    // Fungsi pembantu agar kode lebih rapi
    updateCenterReference() {
        let closest = this.items[0];
        let minDist = Math.abs(closest.y - 515);

        this.items.forEach((item) => {
            const dist = Math.abs(item.y - 515);
            if (dist < minDist) {
                closest = item;
                minDist = dist;
            }
        });

        this.centerMask = closest;
        // Ambil index tekstur dari item yang terpilih sebagai yang paling tengah
        this.currentIndex = this.masks.indexOf(closest.texture.key);
    }

    getResultCategory() {
        // Pastikan kita mengambil texture key dari object centerMask yang sudah diupdate paling baru
        const currentTexture = this.centerMask.texture.key;
        const targetTexture = this.masks[this.targetIndex];

        // Log untuk debugging (bisa dihapus jika sudah lancar)
        console.log(`Target: ${targetTexture}, Current: ${currentTexture}, Y: ${this.centerMask.y}`);

        if (currentTexture !== targetTexture) {
            return "miss";
        }

        const precision = Math.abs(this.centerMask.y - 515);

        if (precision < 30) return "perfect"; // Sedikit dilonggarkan
        if (precision < 90) return "great";
        if (precision < 160) return "good";

        return "miss";
    }

    startTimer() {
        // Reset waktu ke maksimal
        this.timeLeft = 100000;

        // Pastikan draw awal 100%
        this.progressBar.draw(1);

        this.time.addEvent({
            delay: 100, // Menggunakan interval lebih kecil agar bar bergerak lebih mulus
            loop: true,
            callback: () => {
                if (this.timeLeft > 0) {
                    this.timeLeft -= 100;

                    // Hitung persen, pastikan tidak kurang dari 0
                    const percent = Math.max(0, this.timeLeft / 100000);
                    this.progressBar.draw(percent);
                } else {
                    // LOGIKA SAAT WAKTU HABIS
                    this.isTimeout = true;
                    this.handleTimeOut();
                }
            }
        });
    }

    handleTimeOut() {
        // Berhentikan shuffle dan berikan feedback ke pemain
        this.shuffleTimer?.remove(false);
        this.tweens.killTweensOf(this.items);

        this.comboText.setText("TIME OUT!").setColor("#ff0000");
        this.point = []; // Reset combo
        this.comboText2.setText("");

        const totalPerfect = this.perfectPoint.reduce((sum, value) => sum + value, 0);
        const totalGreat = this.greatPoint.reduce((sum, value) => sum + value, 0);
        const totalGood = this.goodPoint.reduce((sum, value) => sum + value, 0);
        const totalMiss = this.missPoint.length;
        const maxCombo = Math.max(...this.maxComboPoint);
        const totalScore = (totalPerfect + totalGreat + totalGood);

        // Mulai ronde baru setelah jeda
        this.time.delayedCall(1000, () => {
            this.scene.start("SummaryScene", {
                totalScore: totalScore,
                maxCombo: maxCombo,
                perfect: totalPerfect,
                great: totalGreat,
                good: totalGood,
                miss: totalMiss
            });
        });
    }

    stopShuffle() {
        if (!this.isTimeout) {
            // Hentikan semua timer dan tween
            this.isTimeout = true; // Gunakan flag ini untuk memutus loop moveCarousel

            // Hentikan semua animasi yang sedang berjalan tepat di tempatnya
            this.tweens.killTweensOf(this.items);

            this.updateCenterReference();
            const result = this.getResultCategory();

            if (result === "perfect") {
                this.point.push(1);
                this.perfectPoint.push(100);
                this.maxComboPoint.push(this.point.length);
                this.comboText.setText("PERFECT!").setColor("#00ff00");
                this.animateSuccess();
            } else if (result === "great") {
                this.point.push(1);
                this.greatPoint.push(50);
                this.maxComboPoint.push(this.point.length);
                this.comboText.setText("GREAT!").setColor("#00ffff");
            } else if (result === "good") {
                this.point.push(1);
                this.goodPoint.push(20);
                this.maxComboPoint.push(this.point.length);
                this.comboText.setText("GOOD").setColor("#ffff00");
            } else {
                // Ini akan terpanggil jika getResultCategory mengembalikan "miss"
                this.point = [];
                this.missPoint.push(0);
                this.comboText.setText("MISS!").setColor("#ff0000");
            }

            this.comboText2.setText(this.point.length > 0 ? "Combo x" + this.point.length : "");

            this.time.delayedCall(1500, () => {
                this.isTimeout = false; // Reset flag agar bisa jalan lagi
                this.startRound();
            });
        }

    }

    createCarousel() {
        const centerX = 970;
        const centerY = 515;
        const gap = this.gap;
        const centerIndex = 2; // Kita geser index tengah ke-2 (karena sekarang ada 6 item)

        this.items = [];

        for (let i = 0; i < 6; i++) { // Ubah jadi 6
            const y = centerY + (i - centerIndex) * gap;

            const mask = this.add.image(
                centerX,
                y,
                this.masks[i % this.masks.length] // Ambil tekstur berulang
            ).setScale(1.23);

            mask.setAlpha(0);
            this.items.push(mask);
        }

        this.centerMask = this.items[centerIndex];
    }

    animateSuccess() {

        this.tweens.add({

            targets: this.centerMask,

            scale: 1.8,

            yoyo: true,

            duration: 200

        })

    }

}