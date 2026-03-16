import Phaser from "phaser"

export default class ProgressBar {
    bar: Phaser.GameObjects.Graphics
    maxWidth = 500
    // Simpan koordinat agar mudah diatur
    x = 0
    y = 40

    constructor(scene: Phaser.Scene) {
        this.bar = scene.add.graphics();

        // Hitung posisi tengah: (Lebar Layar / 2) - (Setengah Lebar Bar)
        this.x = (scene.scale.width / 2) - (this.maxWidth / 2);
    }

    draw(percent: number) {
        // KUNCI: Pastikan percent tidak pernah di bawah 0 atau di atas 1
        const safePercent = Math.max(0, Math.min(1, percent));

        this.bar.clear();

        // Background Bar (Hitam)
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, this.maxWidth, 20);

        // Progress Bar (Merah)
        if (safePercent > 0) {
            this.bar.fillStyle(0xff3b3b);
            this.bar.fillRect(this.x, this.y, this.maxWidth * safePercent, 20);
        }
    }
}