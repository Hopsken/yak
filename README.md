# Yak

> [!WARNING]
> WIP: this project is still on WIP state.

Yak is a tool to build your own digital garden, powered by Next.js and [Keystatic](https://keystatic.com/).

Inspired by [Andy's working notes](https://notes.andymatuschak.org/).

Demo: [https://hopsken.com](https://hopsken.com)

## Highlights

**Fast and responsive**

- Fast page render powered by Next.js SSR
- Responsive design
- SEO friendly

**File based storage**

- Own your own content
- Use Github repo as the content storage
- Admin UI with live edit! Powered by Keystatic!

## Quick start

- Star this repo
- Fork this project & clone
- Customize `yak.config.js` and choose a repo to store your content. Recommend create another repo for this.
- Replace `favicon.icon` in `/public` folder with your own
- Run `pnpm run dev` and go to `localhost:3000/keystatic`. Follow the step to create a Github App. Some environment variables will be generated in a `.env` file. Copy them.
- Create a Github Personal Access Token with read access to your content repo.
- Deploy to the platform of your choose and set the environment acquired from last steps.
  - ...from env file
  - `GITHUB_ACCESS_TOKEN`

## Roadmap

- [] Support `[[page]]` syntax
- [] Dark mode
- [] Site map
- [] ...

## Technical details

Yak uses Keystatic for content management. It's a super awesome project allows you to save your content as files while offer very powerful features including a WYSIWYG editor, rich content, highly customizable collections, Github based collaboration and so on.

## Contributors

Hopsken

## License

MIT License
