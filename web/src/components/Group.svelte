<script lang="ts">
    import type { CommandTreeGroup } from "shared/src/web_api";
    import Command from "./Command.svelte";
    import Group from "./Group.svelte";

    interface Props {
        group: CommandTreeGroup;
        level: number;
    }
    let { group, level }: Props = $props();

    let heading = "h" + (level + 2);
</script>

<li>
    {#if group.commands}
        <ul>
            {#each group.commands as item}
                {#if item.type === "Group"}
                    <Group group={item} level={level + 1} />
                {:else}
                    <Command command={item} level={level + 1} />
                {/if}
            {/each}
        </ul>
    {/if}
</li>

<style lang="scss">
</style>
