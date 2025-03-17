<script lang="ts">
    import type { Stats } from "../structs/stats";
    import Owl from "./art/Owl.svelte";

    interface Props {
        stats: Stats;
    }

    let { stats }: Props = $props();
</script>

<header>
    <Owl />
    <h1>Hootsifer</h1>
    <p>A multi-purpose Discord bot</p>
    <p>
        Trusted by <var
            style="--animatedNumber: {stats.memberCount}; --duration: 4s"
            aria-label={String(stats.memberCount)}
        ></var> members
    </p>
    <p>
        In <var
            style="--animatedNumber: {stats.guildCount}; --duration: 1s"
            aria-label={String(stats.guildCount)}
        ></var> communities
    </p>
</header>

<style lang="scss">
    @property --num {
        syntax: "<integer>";
        initial-value: 0;
        inherits: false;
    }

    header {
        text-align: center;

        & h1 {
            font-weight: 400;
            font-size: 3rem;
            padding-top: 1.5rem;
        }

        & p {
            padding: 0;
            margin: 5px 0;
        }

        * var {
            color: var(--theme-accent);
            font-style: normal;
            font-weight: 600;

            animation: counter var(--duration) forwards alternate ease-out;
            counter-reset: num var(--num);

            &::before {
                content: var(--num);
                content: counter(num);
            }
        }

        @keyframes counter {
            from {
                --num: 0;
            }
            to {
                --num: var(--animatedNumber);
            }
        }
    }
</style>
