<script lang="ts">
    import type { CommandTreeCommand } from "shared/src/web_api";
    import Argument from "./Argument.svelte";

    interface Props {
        command: CommandTreeCommand;
        level: number;
    }
    let { command, level }: Props = $props();
    let heading = "h" + (level + 2);
</script>

<li>
    <h4>
        {command.commandName.replace(/-/g, " ")}
    </h4>

    <p>{command.description}</p>

    {#if command.options}
        <ul>
            {#each command.options as option}
                <Argument {option} />
            {/each}
        </ul>
    {/if}
</li>

<style lang="scss">
    h4 {
        background-color: var(--theme-tertiary);
        padding: 0.2rem 0.5rem;
        border-radius: 0.4rem;
        width: fit-content;

        &::before {
            content: "/";
        }
    }

    p {
        margin-block: 0.2rem 0.5rem;
        font-size: 0.9rem;
    }

    ul {
        list-style: disc;
        opacity: 0.8;
        gap: 0.4rem !important;
        padding-inline-start: 1rem;
    }
</style>
