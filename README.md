# ts-pinch-zoom

## Introduction
`ts-pinch-zoom` is a lightweight, performant library built using TypeScript for enabling pinch-zoom and scroll functionalities on HTML elements. It provides seamless interaction for touch devices and smooth zooming experiences for users.

브라우저에서는 자체 내장 기능으로 인해 pinch zoom이 가능하지만, Webview에서 사용할 때에는 제한되는 부분이 있어 ts pinch zoom을 제작하였습니다.

## Features
- Pinch-to-zoom support
- Momentum scrolling
- Configurable zoom range
- Smooth animation and transitions
- Support for touch and pointer events

---

## Installation

Install the package using npm:

```bash
npm install ts-pinch-zoom
```

Or using yarn:

```bash
yarn add ts-pinch-zoom
```

---

## Usage

### Basic Example

1. Import the package and initialize it with a target element.

```typescript
import { PinchZoom } from 'ts-pinch-zoom';

const container = document.querySelector('#zoom-container') as HTMLElement;
const pinchZoom = new PinchZoom(container, {
  zoomMin: 1,
  zoomMax: 3,
  startZoom: 1,
});
```

2. Add some basic HTML and CSS:

```html
<div id="zoom-container" style="width: 300px; height: 300px; overflow: hidden;">
  <img src="image.jpg" alt="Zoomable Image" style="width: 100%; height: auto;">
</div>
```

---

## Options
The library accepts an options object to customize its behavior:

| Option                  | Type                   | Default              | Description                                                  |
|------------------------|------------------------|----------------------|--------------------------------------------------------------|
| `zoom`                  | `boolean`              | `true`               | Enables or disables zoom functionality.                      |
| `zoomMin`               | `number`               | `1`                  | Minimum zoom scale.                                          |
| `zoomMax`               | `number`               | `3`                  | Maximum zoom scale.                                          |
| `startZoom`             | `number`               | `1`                  | Initial zoom scale when the component loads.                 |
| `scrollX`               | `boolean`              | `true`               | Enables horizontal scrolling.                                |
| `scrollY`               | `boolean`              | `true`               | Enables vertical scrolling.                                  |
| `momentum`              | `boolean`              | `true`               | Enables momentum-based scrolling.                            |
| `bounce`                | `boolean`              | `false`              | Enables bounce effect when scrolling past boundaries.        |
| `preventDefault`        | `boolean`              | `true`               | Prevents default scrolling behavior during touch events.     |

For a full list of options, refer to the source code.

---

## Methods

| Method                     | Description                                                         |
|----------------------------|---------------------------------------------------------------------|
| `scrollTo(x: number, y: number, time?: number)`  | Scrolls to the specified position with optional animation time.  |
| `zoom(scale: number, x?: number, y?: number, time?: number)` | Zooms to a specific scale at the given coordinates.              |
| `refresh()`                 | Recalculates layout and updates the component.                     |
| `disable()`                 | Disables interaction with the component.                           |
| `enable()`                  | Enables interaction with the component.                            |

---

## Example: Advanced Usage

```typescript
import { PinchZoom } from 'ts-pinch-zoom';

const container = document.getElementById('zoom-container') as HTMLElement;
const pinchZoom = new PinchZoom(container, {
  zoomMin: 0.5,
  zoomMax: 5,
  startZoom: 1,
  bounce: true,
  scrollX: true,
  scrollY: true,
});

pinchZoom.on('zoomStart', () => {
  console.log('Zoom started');
});

pinchZoom.on('zoomEnd', () => {
  console.log('Zoom ended');
});
```

---

## Development
To set up the project locally:

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/ts-pinch-zoom.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

To build the project:
```bash
npm run build
```

To run tests:
```bash
npm run test
```

---

## License
This project is licensed under the [MIT License](LICENSE).

---

## Author
**yohan.kim**
- Email: [yohanpro@yohanpro.com](mailto:yohanpro@yohanpro.com)

Feel free to contact me for questions or contributions!

---

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

---

## Changelog
See [CHANGELOG.md](CHANGELOG.md) for recent updates.

---

## Acknowledgments
Special thanks to the contributors and open-source community.

