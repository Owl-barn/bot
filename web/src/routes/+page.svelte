<script lang="ts">
    import Hero from "components/Hero.svelte";
    import Note from "components/art/Note.svelte";
</script>

<main class="main">
    <Hero />

    <section class="divider"></section>

    <section class="features">
        <!-- Music -->
        <article>
            <section class="artwork">
                <Note delay={800} size={120} />
                <Note delay={0} size={80} />
            </section>
            <section class="info">
                <h1 class="premium">Music streaming</h1>
                <p>
                    Use Hootsifer's one of a kind Owlet system and listen to
                    music in a <b>multitude of channels</b> at once!
                </p>
            </section>
        </article>

        <!-- Vc -->
        <article>
            <section class="artwork">
                <Note delay={0} size={120} />
                <Note delay={800} size={80} />
            </section>
            <section class="info">
                <h1>Voice channel privacy</h1>
                <p>Create your own invite-only voice channel in 1 click!</p>
            </section>
        </article>

        <!-- Notify -->
        <article>
            <section class="artwork">
                <Note delay={0} size={120} />
                <Note delay={800} size={80} />
            </section>
            <section class="info">
                <h1>Get notified</h1>
                <p>
                    Get a personal message from hootsifer whenever your friend
                    joins the voice chat!
                </p>
            </section>
        </article>

        <!-- Birthday -->
        <article>
            <section class="artwork">
                <Note delay={0} size={120} />
                <Note delay={800} size={80} />
            </section>
            <section class="info">
                <h1>Happy Birthday!</h1>
                <p>
                    Keep track of your friend&apos;s birthdays and automatically
                    congratulate them with their own role!
                </p>
            </section>
        </article>

        <!-- Moderation -->
        <article>
            <section class="artwork">
                <Note delay={0} size={120} />
                <Note delay={800} size={80} />
            </section>
            <section class="info">
                <h1>Moderate with ease</h1>
                <p>
                    Moderate your community easily and effectively with
                    Hootsifer&apos;s unique tools designed with the biggest of
                    communities in mind!
                </p>
            </section>
        </article>

        <!-- Level -->
        <article>
            <section class="artwork">
                <Note delay={0} size={120} />
                <Note delay={800} size={80} />
            </section>
            <section class="info">
                <h1>Level leaderboard</h1>
                <p>Gain experience with each message and get rewards!</p>
            </section>
        </article>

        <!-- Selfrole -->
        <article>
            <section class="artwork">
                <Note delay={0} size={120} />
                <Note delay={800} size={80} />
            </section>
            <section class="info">
                <h1>Express yourself!</h1>
                <p>
                    Allow your community to easily assign themselves certain <b
                        >self roles</b
                    >!
                </p>
            </section>
        </article>
    </section>
</main>

<style lang="scss">
    .premium::after {
        content: "*";
        font-size: 2rem;
        color: var(--theme-accent);
    }

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
        gap: 200px;
        padding-top: 6rem;
    }

    article {
        display: flex;
        gap: 3rem;

        &:nth-child(even) {
            flex-direction: row-reverse;
        }

        * h1 {
            font-size: 2.5rem;
            padding: 0;
            margin: 0;

            text-align: left;
        }

        * p {
            font-size: 1.1rem;
            padding: 0;
            margin: 0;
        }

        & .info {
            flex: 2;
        }

        & > .artwork {
            flex-direction: row;
            align-items: center;

            & > * {
                padding: 10px;
            }
        }
    }
</style>
