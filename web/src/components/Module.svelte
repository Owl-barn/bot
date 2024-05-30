<script lang="ts">
    import type { CommandTreeModule } from "shared/src/web_api";
    import Command from "./Command.svelte";
    import Group from "./Group.svelte";

    interface Props {
        module: CommandTreeModule;
    }
    let { module }: Props = $props();
</script>

<li class="item">
    <section class="info">
        <h2>{module.name} <span> - {module.type}</span></h2>
        <p>{module.description}</p>
    </section>

    {#if module.commands}
        <ul>
            {#each module.commands as item, index}
                {#if item.type === "Group"}
                    <Group group={item} level={1} />
                {:else}
                    <Command command={item} level={1} />
                {/if}
            {/each}
        </ul>
    {/if}
</li>

<style lang="scss">
    .info {
        margin-block: 6rem 3rem;

        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.835);
    }

    h2 {
        font-size: 3rem;
        font-weight: 300;

        & span {
            font-size: 1rem;
            font-weight: lighter;
            opacity: 0.7;
        }
    }

    ul {
        :global(> li) {
            margin-bottom: 3rem;
            background-color: var(--theme-secondary);
            border-radius: var(--border-radius);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.823);
            padding: 1rem;
        }

        :global( ul) {
            display: flex;
            flex-direction: column;
            gap: 1.3rem;
        }
    }

    li {
        padding: 1rem;
        width: min(100%, 80ch);
    }
</style>
