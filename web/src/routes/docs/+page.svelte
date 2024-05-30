<script lang="ts">
    import Module from "components/Module.svelte";

    let { data } = $props();
</script>

<h1>Command documentation</h1>
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
    }

    :global(ul) {
        list-style: none;
        padding: 0;
    }
</style>
