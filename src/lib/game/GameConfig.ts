export const createGame = async (parent: string) => {

    const Phaser = await import("phaser")
    const { default: GameScene } = await import("./GameScene")
    const { default: SummaryScene } = await import("./SummaryScene")
    const { default: StartScene } = await import("./StartScene")

    return new Phaser.default.Game({

        type: Phaser.default.AUTO,

        width: window.innerWidth,
        height: window.innerHeight,

        parent: parent,

        backgroundColor: "#ffffff",

        scene: [StartScene, GameScene, SummaryScene],

        scale: {
            mode: Phaser.default.Scale.FIT,
            autoCenter: Phaser.default.Scale.CENTER_BOTH
        }

    })
}