import Phaser from "phaser"
import ProgressBar from "../ui/ProgressBar"
import FeedbackText from "../ui/FeedbackText"
import ComboSystem from "../systems/ComboSystem"

export default class GameScene extends Phaser.Scene {
    masks = ["mask1", "mask2", "mask3", "mask4"]

    point: number[] = []
    perfectPoint: number[] = []
    greatPoint: number[] = []
    goodPoint: number[] = []
    missPoint: number[] = []
    maxComboPoint: number[] = []

    targetMask!: Phaser.GameObjects.Image
    centerMask!: Phaser.GameObjects.Image
    comboText!: Phaser.GameObjects.Text
    comboText2!: Phaser.GameObjects.Text
    items!: Phaser.GameObjects.Image[]

    shuffleTimer?: Phaser.Time.TimerEvent

    targetIndex = 0
    currentIndex = 0
    carouselIndex = 0

    progressBar!: ProgressBar
    feedback!: FeedbackText
    comboSystem = new ComboSystem()

    timeLeft = 5000;
    isTimeout = false;
    isMoving = false;

    centerX = 520;
    centerY = 416;
    gap = 310;

    durationCarosel = 1500;


    constructor() {
        super("GameScene")
    }

    preload() {
        this.load.image("mask1", "/src/lib/assets/masks/mask1.png")
        this.load.image("mask2", "/src/lib/assets/masks/mask2.png")
        this.load.image("mask3", "/src/lib/assets/masks/mask3.png")
        this.load.image("mask4", "/src/lib/assets/masks/mask4.png")
        this.load.image("bg", "/src/lib/assets/img_background.png")
    }

    create() {
        const { width, height } = this.scale

        // 1. Background (Depth 0)
        const bg = this.add.image(width / 2, height / 2, "bg").setDepth(0)
        bg.setDisplaySize(width, height)

        // 2. Lingkaran putih target kiri (Depth 1)
        this.add.circle(150, 250, 90, 0xffffff).setDepth(1)

        // 3. Inisialisasi UI dan Carousel
        this.createUI()

        // 4. Mulai game
        this.startRound()

        // Tombol SPACE
        this.input.keyboard?.on("keydown-SPACE", () => {
            this.stopShuffle()
        })
    }

    createUI() {
        // Target mask kiri (Depth 2)
        this.targetMask = this.add.image(150, 250, "mask1")
            .setScale(0.40)
            .setDepth(2)

        // Text combo (Depth 20 agar selalu di depan)
        this.comboText = this.add.text(870, 100, "", { // Pindah ke atas bingkai
            fontFamily: '"Permanent Marker"',
            fontSize: "50px",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 8,
            align: "center"
        }).setOrigin(0.5).setDepth(100); // Depth sangat tinggi agar di paling depan

        this.comboText2 = this.add.text(870, 150, "", {
            fontFamily: '"Permanent Marker"',
            fontSize: "40px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(100);

        this.comboText.setShadow(2, 2, "#000000", 5)
        this.comboText2.setShadow(2, 2, "#000000", 5)

        this.progressBar = new ProgressBar(this)
        this.startTimer()
        this.createCarousel()
    }

    createCarousel() {
        this.items = [];
        const shape = this.make.graphics();
        shape.fillStyle(0xffffff);
        shape.fillCircle(this.centerX, this.centerY, 160);
        const geometryMask = shape.createGeometryMask();

        for (let i = 0; i < 6; i++) {
            // Gunakan THIS.centerY agar sinkron
            const y = this.centerY + (i - 2) * this.gap;
            const mask = this.add.image(this.centerX, y, this.masks[i % this.masks.length]);

            const frameSize = 320;
            const scaleFactor = frameSize / mask.width;

            mask.setScale(scaleFactor)
                .setDepth(5)
                .setMask(geometryMask)
                .setAlpha(0); // Mulai dari 0, nanti di-fade in oleh startShuffle

            mask.setData('baseScale', scaleFactor);
            this.items.push(mask);
        }
    }

    startRound() {
        // HAPUS variabel lokal centerY = 515 yang salah di sini
        const centerIndex = 2;

        this.items.forEach((item, i) => {
            this.tweens.killTweensOf(item);
            // Gunakan this.centerY (416) agar posisi awal sudah pas dengan bingkai
            const targetY = this.centerY + (i - centerIndex) * this.gap;
            item.setY(targetY);

            // Reset state awal
            const baseScale = item.getData('baseScale');
            if (i === centerIndex) {
                item.setAlpha(1).setScale(baseScale);
                this.centerMask = item;
            } else {
                item.setAlpha(0);
            }
        });

        this.targetIndex = Phaser.Math.Between(0, this.masks.length - 1);
        this.targetMask.setTexture(this.masks[this.targetIndex]);
        this.isMoving = false;

        // Beri jeda sedikit sebelum shuffle agar mata pemain bisa melihat target
        this.time.delayedCall(500, () => {
            this.startShuffle();
        });
    }

    startShuffle() {
        this.shuffleTimer?.remove(false);
        this.items.forEach(item => {
            this.tweens.add({
                targets: item,
                alpha: 1,
                duration: this.durationCarosel <= 500 ? this.durationCarosel : 500
            });
        });
        this.moveCarousel();
    }

    moveCarousel() {
        if (this.isTimeout) return;

        const topLimit = this.centerY - (this.gap * 3);
        const bottomLimit = this.centerY + (this.gap * 2);

        this.items.forEach((item) => {
            const targetY = item.y - this.gap;

            this.tweens.add({
                targets: item,
                y: targetY,
                duration: this.durationCarosel <= 500 ? this.durationCarosel : 500,
                ease: "Cubic.easeInOut",
                onUpdate: () => {
                    const distance = Math.abs(item.y - this.centerY);
                    const baseScale = item.getData('baseScale');

                    // Alpha transisi halus
                    const alpha = Phaser.Math.Clamp(1 - (distance / (this.gap * 1.2)), 0, 1);
                    item.setAlpha(alpha);

                    // Efek scale fokus di tengah
                    if (distance < 50) {
                        item.setScale(baseScale * 1.1);
                    } else {
                        item.setScale(baseScale);
                    }
                },
                onComplete: () => {
                    if (item.y <= topLimit + 10) {
                        item.y = bottomLimit;
                        this.carouselIndex = (this.carouselIndex + 1) % this.masks.length;
                        item.setTexture(this.masks[this.carouselIndex]);
                    }

                    if (item === this.items[this.items.length - 1]) {
                        this.moveCarousel();
                    }
                }
            });
        });
    }

    updateCenterReference() {
        let closest = this.items[0];
        let minDist = Math.abs(closest.y - this.centerY);

        this.items.forEach((item) => {
            const dist = Math.abs(item.y - this.centerY);
            if (dist < minDist) {
                closest = item;
                minDist = dist;
            }
        });

        this.centerMask = closest;
    }

    getResultCategory() {
        const currentTexture = this.centerMask.texture.key;
        const targetTexture = this.masks[this.targetIndex];

        // 1. Cek apakah gambar cocok. Jika tidak cocok, mutlak MISS.
        if (currentTexture !== targetTexture) return "miss";

        // 2. Hitung jarak absolut dari titik tengah (416)
        const precision = Math.abs(this.centerMask.y - this.centerY);

        // 3. Logika Tangga (Mulai dari yang paling ketat/Perfect)
        // Kita perlebar angkanya agar posisi seperti di gambar Anda terhitung "Great" atau "Good"
        if (precision < 20) {
            return "perfect"; // Sangat tepat di tengah
        } else if (precision < 50) {
            return "great";   // Sedikit meleset (posisi di gambar Anda kemungkinan masuk sini)
        } else if (precision < 100) {
            return "good";    // Terlihat meleset tapi masih di dalam area bingkai
        }

        // Jika lebih dari 100 pixel dari tengah, dianggap meleset terlalu jauh
        return "miss";
    }

    startTimer() {
        this.timeLeft = 100000;
        this.progressBar.draw(1);

        this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (this.timeLeft > 0) {
                    this.timeLeft -= 100;
                    const percent = Math.max(0, this.timeLeft / 100000);
                    this.progressBar.draw(percent);
                } else {
                    this.isTimeout = true;
                    this.handleTimeOut();
                }
            }
        });
    }

    handleTimeOut() {
        this.tweens.killTweensOf(this.items);
        this.comboText.setText("TIME OUT!").setColor("#ff0000");
        this.isTimeout = false;
        const totalPerfect = this.perfectPoint.reduce((a, b) => a + b, 0);
        const totalGreat = this.greatPoint.reduce((a, b) => a + b, 0);
        const totalGood = this.goodPoint.reduce((a, b) => a + b, 0);
        const totalScore = totalPerfect + totalGreat + totalGood;

        this.time.delayedCall(1000, () => {
            this.scene.start("SummaryScene", {
                totalScore: totalScore,
                perfect: totalPerfect,
                great: totalGreat,
                good: totalGood,
                miss: this.missPoint.length
            });
        });
    }

    stopShuffle() {
        if (!this.isTimeout) {
            this.isTimeout = true;
            this.tweens.killTweensOf(this.items);

            this.updateCenterReference();
            const result = this.getResultCategory();

            if (result === "perfect") {
                this.point.push(1);
                this.perfectPoint.push(100);
                this.durationCarosel = this.durationCarosel - 50;
                this.comboText.setText("PERFECT!").setColor("#00ff00");
                this.animateSuccess();
            } else if (result === "great") {
                this.point.push(1);
                this.greatPoint.push(50);
                this.durationCarosel = this.durationCarosel - 50;
                this.comboText.setText("GREAT!").setColor("#00ffff");
            } else if (result === "good") {
                this.point.push(1);
                this.goodPoint.push(20);
                this.durationCarosel = this.durationCarosel - 50;
                this.comboText.setText("GOOD").setColor("#ffff00");
            } else {
                this.point = [];
                this.missPoint.push(0);
                this.durationCarosel = 1500;
                this.comboText.setText("MISS!").setColor("#ff0000");
            }

            this.comboText2.setText(this.point.length > 0 ? "Combo x" + this.point.length : "");

            this.time.delayedCall(1500, () => {
                this.isTimeout = false;
                this.startRound();
            });
        }
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