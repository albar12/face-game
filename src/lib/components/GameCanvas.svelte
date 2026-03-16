<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createGame } from '../game/GameConfig';

	let game: any;

	onMount(async () => {
		if (!browser) return;

		game = await createGame('game-container');
	});

	function stopGame() {
		const scene = game.scene.getScene('GameScene');

		scene.stopGame();
	}
</script>

<div id="game-container"></div>
