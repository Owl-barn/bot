<script lang="ts">
    import Module from "components/Module.svelte";

    let { data } = $props();
</script>

<svelte:head>
    <title>Documentation - Hootsifer</title>
</svelte:head>

<main>
    <ul>
        {#each data.commands as module}
            <Module {module} />
        {/each}
    </ul>
</main>

<style lang="scss">
    main {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    :global(ul) {
        list-style: none;
        padding: 0;
    }
</style>
