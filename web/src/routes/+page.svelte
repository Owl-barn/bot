<script lang="ts">
    import Feature from "components/Feature.svelte";
    import Hero from "components/Hero.svelte";
    import Lock from "components/art/Lock.svelte";
    import Note from "components/art/Note.svelte";
    import Envelope from "components/art/Envelope.svelte";

    let { data } = $props();
</script>

<main class="main">
    <Hero stats={data.stats} />

    <section class="divider"></section>

    <section class="features">

        <!-- Music -->
        {#snippet notes()}
        <Note delay={800} size={6} />
        <Note delay={0} size={4} />
        {/snippet}
        
        <Feature
            title="Music streaming"
            artwork={notes}
            moduleId="owlet"
            premium
        >
            Use Hootsifer's one of a kind Owlet system and listen to music in a <b>multitude of channels</b
            > at once!
        </Feature>

        <!-- Vc -->
        {#snippet lock()}
            <Lock/>
        {/snippet}
        <Feature
            title="Voice channel privacy"
            artwork={lock}
            moduleId="private-room"
        >
            Create your own invite-only voice channel in 1 click!
        </Feature>

        <!-- Notify -->
        {#snippet envelope()}
            <Envelope/>
        {/snippet}
        <Feature title="Get notified" artwork={envelope} moduleId="notify">
            Get a personal message from Hootsifer whenever your friend joins the
            voice chat!
        </Feature>

        <!-- Birthday -->
        <Feature title="Happy Birthday!" artwork={notes} moduleId="birthday">
            Keep track of your friend's birthdays and automatically congratulate
            them with their own role!
        </Feature>

        <!-- Moderation -->
        <Feature
            title="Moderate with ease"
            artwork={notes}
            moduleId="moderation"
        >
            Moderate your community easily and effectively with Hootsifer's
            unique tools designed with the biggest of communities in mind!
        </Feature>

        <!-- Level -->
        <Feature title="Level leaderboard" artwork={notes} moduleId="level">
            Gain experience with each message and get rewards!
        </Feature>

        <!-- Selfrole -->
        <Feature title="Express yourself!" artwork={notes} moduleId="selfrole">
            Easily configure <b>self roles</b> for your community and watch your community express themselves!
        </Feature>

        <!-- Reminder -->
        <Feature title="Never forget" artwork={notes} moduleId="reminder">
            Set reminders for yourself and never forget to do that one thing again!
        </Feature>
    </section>
</main>

<style lang="scss">
    $scale: 4vw;

    .main {
        padding: 6rem 2rem;
        padding-bottom: 12rem;
        display: flex;
        align-items: center;
        flex-direction: column;

        gap: 3rem;
    }

    .divider {
        width: min(80ch, 100%);
        height: 2px;
        background-color: var(--theme-text-dark);
    }

    .features {
        display: flex;
        align-items: center;
        flex-direction: column;
        width: min(80ch, 100%);
        gap: clamp(5rem, $scale, 14rem);
        padding-top: 6rem;
    }
</style>
