<script lang="ts">
    import { optionTypes } from "lib/OptionType";
    import type { CommandTreeOption } from "shared/web_api";

    interface Props {
        option: CommandTreeOption;
    }
    let { option }: Props = $props();

    let type = optionTypes[option.type as keyof typeof optionTypes];
</script>

<li>
    <span class="name">
        {option.name}
        {#if option.required}
            <span class="required">*</span>
        {/if}
        <span class="type" style="background-color: {type.color};">
            <!-- <span class="prefix">{type.prefix}</span> -->
            {type.name}
        </span>
    </span>

    <p>{option.description}</p>
</li>

<style lang="scss">
    .name {
        font-weight: 600;
        display: inline-flex;
        padding-bottom: 2px;

        & .required {
            color: var(--theme-danger);
            font-size: 1.2em;
        }

        & .type {
            font-weight: 500;
            font-size: 0.7rem;
            padding: 0.3em 0.6em;
            margin-left: 0.5em;
            border-radius: 0.4em;

            & .prefix {
                font-weight: 600;
            }
        }
    }

    p {
        font-size: 0.9rem;
    }

    li {
        margin-inline-start: 1.5rem;

        &::marker {
            color: var(--theme-accent);
        }
    }
</style>
