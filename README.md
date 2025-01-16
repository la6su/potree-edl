# README

This project is based on the core/loading parts of [Potree](http://potree.org/), converted to Typescript for usage directly in ThreeJS-based third-party applications.

This project focuses solely on the loading of point clouds into ThreeJS applications and doesn't try to provide other things which are available in Potree: earth controls, measurement tools, elevation profiles, etc.

If you have a need for such auxiliary components/tools, we would most definitely welcome contributions, potentially as part of another project under the PNext organization.

And of course, suggestions for better/easier APIs or new features, as well as PRs, are very welcome too!

# Usage


# Local Development

To develop and contribute to the project, you need to start by cloning the repositry and then install all the dependencies with yarn:

```bash
> yarn
```

Once that is done you can start a development server by running:

```bash
> yarn start
```

You can also start the example application (`/example`) by running:

```bash
> yarn start:example
```

To create a production-ready build of the library which can be published to NPM, you can run the following command:

```bash
> yarn build
```

# Thank You!

Thank you to Markus Schütz for his work on Potree, on which this project is based.

# Contributors

## Pix4D

We use this as part of our online 3D model viewer (http://cloud.pix4d.com).

## Georepublic
