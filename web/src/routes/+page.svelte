<script lang="ts">
    import Feature from "components/Feature.svelte";
    import Hero from "components/Hero.svelte";
    import Note from "components/art/Note.svelte";

    let { data } = $props();
</script>

<main class="main">
    <Hero stats={data.stats} />

    <section class="divider"></section>

    <section class="features">
        <!-- Music -->

        {#snippet Notes()}
        <Note delay={800} size={6} />
        <Note delay={0} size={4} />
        {/snippet}
        
        <Feature
            title="Music streaming"
            artwork={Notes}
            moduleId="owlet"
            premium
        >
            Use Hootsifer's one of a kind Owlet system and listen to music in a <b
                >multitude of channels</b
            > at once!
        </Feature>

        <!-- Vc -->
        <Feature
            title="Voice channel privacy"
            artwork={Notes}
            moduleId="private-room"
        >
            Create your own invite-only voice channel in 1 click!
        </Feature>

        <!-- Notify -->
        <Feature title="Get notified" artwork={Notes} moduleId="notify">
            Get a personal message from hootsifer whenever your friend joins the
            voice chat!
        </Feature>

        <!-- Birthday -->
        <Feature title="Happy Birthday!" artwork={Notes} moduleId="birthday">
            Keep track of your friend's birthdays and automatically congratulate
            them with their own role!
        </Feature>

        <!-- Moderation -->
        <Feature
            title="Moderate with ease"
            artwork={Notes}
            moduleId="moderation"
        >
            Moderate your community easily and effectively with Hootsifer&apos;s
            unique tools designed with the biggest of communities in mind!
        </Feature>

        <!-- Level -->
        <Feature title="Level leaderboard" artwork={Notes} moduleId="level">
            Gain experience with each message and get rewards!
        </Feature>

        <!-- Selfrole -->
        <Feature title="Express yourself!" artwork={Notes} moduleId="selfrole">
            Allow your community to easily assign themselves certain
            <b>self roles</b>!
        </Feature>

        <!-- Reminder -->
        <Feature title="Never forget" artwork={Notes} moduleId="reminder">
            Set reminders for yourself and never forget to do that one thing again!
        </Feature>
    </section>
</main>

<style lang="scss">
    $scale: 4vw;

    .main {
        padding: 3rem 2rem;
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
