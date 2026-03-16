import Phaser from "phaser"

export default class FeedbackText {

    text: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene) {

        this.text = scene.add.text(
            650,
            250,
            "",
            {
                fontSize: "42px",
                color: "#000"
            }
        ).setOrigin(0.5)

    }

    showPerfect(combo: number) {

        this.text.setText("Perfect x" + combo)

    }

    showMiss() {

        this.text.setText("Miss")

    }

}