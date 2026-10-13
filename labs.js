/*
 * Workshop content: every lesson, lab, hint, solution and check lives here.
 *
 * Lesson blocks:
 *   { p: '...' }                 paragraph
 *   { ul: ['...'] } / { ol: [] } bullet / numbered list
 *   { h: '...' }                 small heading
 *   { code: `...`, lang: 'html' | 'css' | 'js' }
 *   { html: '...' }              raw HTML (box model diagram, website wireframe)
 *   { h2: '...' }                section heading (reading pages)
 *   { table: { head: [], rows: [[]] } }
 *   { compare: [{ label, parts: [{ lang, code }] }] }   code side by side
 *   { demo: { title, note, height, html } }  live result, loaded on click
 * Code languages: html, css, js, jsx. Links: [text](#step-1) or [text](https://…).
 * In text, `code` is shown in monospace, **bold** and *italic* work too.
 * Prose uses the typographic apostrophe (’) so strings never need escaping.
 *
 * Each criterion has a `label` and a `check(doc, win)` function that receives
 * the preview's document and window. Checks must look at real results
 * (computed styles, the DOM, simulated clicks), never at the source text.
 */
(function () {
  'use strict';

  /* ---------- Helpers shared by the checks ---------- */

  function px(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function text(el) {
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  // Turns any CSS color (rgb(), hex, oklch(), names...) into { r, g, b, a }.
  var ctx2d = null;
  function rgba(color) {
    if (!ctx2d) {
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      ctx2d = canvas.getContext('2d', { willReadFrequently: true });
    }
    ctx2d.clearRect(0, 0, 1, 1);
    ctx2d.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx2d.fillStyle = color;
    ctx2d.fillRect(0, 0, 1, 1);
    var d = ctx2d.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  }

  // Relative luminance (0 = black, 1 = white), see-through colors drawn over white.
  function luminance(color) {
    var c = rgba(color);
    var ch = [c.r, c.g, c.b].map(function (v) {
      v = (v * c.a + 255 * (1 - c.a)) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  // Corner radius in px, also when written as a percentage.
  function radius(value, rect) {
    if (/%/.test(value)) return (parseFloat(value) / 100) * Math.min(rect.width, rect.height);
    return px(value);
  }

  var SIDES = ['Top', 'Right', 'Bottom', 'Left'];

  /* ---------- The 7 steps ---------- */

  var steps = [
    /* ===================== STEP 1 ===================== */
    {
      id: 'html-basics',
      title: 'HTML basics: structure and tags',
      short: 'HTML basics',
      learned: 'How a page is built from tags and elements, the page skeleton (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`), headings and paragraphs.',
      lesson: [
        { p: '**HTML** (HyperText Markup Language) describes the *structure* of a web page: what is a heading, what is a paragraph, what is a list. The browser reads your HTML and draws the page.' },
        { p: 'HTML is written with **tags** in angle brackets. Most tags come in pairs: an opening tag like `<p>` and a closing tag with a slash, `</p>`. The opening tag, the content and the closing tag together make an **element**: `<p>Hello!</p>` is a paragraph element.' },
        { p: 'Every page follows the same skeleton:' },
        {
          lang: 'html',
          code: `<!DOCTYPE html>
<html>
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Welcome!</h1>
    <p>Everything you see goes in the body.</p>
  </body>
</html>`
        },
        {
          ul: [
            '`<!DOCTYPE html>` tells the browser this is a modern HTML page.',
            '`<html>` wraps the whole page.',
            '`<head>` holds information *about* the page, like the `<title>` shown in the browser tab.',
            '`<body>` holds everything visible on the page.'
          ]
        },
        { p: 'Headings go from `<h1>`, the main title (one per page), down to `<h6>`, the smallest. Use them like the chapter and section titles of a book, to show how your content is organized, not just to make text bigger. Regular text goes in paragraphs: `<p>`.' },
        { p: 'Tip: indent elements that sit inside other elements. The browser doesn’t care, but it makes your code much easier to read.' }
      ],
      lab: {
        goal: 'Make this page about you: replace “Hello World” in the `<h1>` with your name, then add a paragraph (`<p>`) below the heading that says something about you.',
        success: 'You just edited your first HTML page.',
        tabs: ['html'],
        starter: {
          html: `<!DOCTYPE html>
<html>
  <head>
    <title>About me</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
`
        },
        solution: {
          html: `<!DOCTYPE html>
<html>
  <head>
    <title>About me</title>
  </head>
  <body>
    <h1>Ada Lovelace</h1>
    <p>I love mathematics, and I wrote the very first computer program.</p>
  </body>
</html>
`
        },
        hints: [
          'Change only the text between `<h1>` and `</h1>`, and keep the tags themselves.',
          'A paragraph looks like `<p>Your text here</p>`. Put it on a new line inside the `<body>`, just below the heading.',
          'Write at least a short sentence (10 characters or more). The checklist updates by itself a moment after you stop typing.'
        ],
        criteria: [
          {
            label: 'The `<h1>` shows your name instead of “Hello World”',
            check: function (doc) {
              var t = text(doc.querySelector('h1'));
              return t !== '' && t.toLowerCase() !== 'hello world';
            }
          },
          {
            label: 'There is a paragraph (`<p>`) with at least 10 characters of text',
            check: function (doc) {
              return Array.prototype.some.call(doc.querySelectorAll('p'), function (p) {
                return text(p).length >= 10;
              });
            }
          }
        ]
      }
    },

    /* ===================== STEP 2 ===================== */
    {
      id: 'links-images-lists',
      title: 'Links, images and lists',
      short: 'Links & images',
      learned: 'Attributes, links with `<a href>`, images with `<img src alt>`, and lists with `<ul>`, `<ol>` and `<li>`.',
      lesson: [
        { p: 'Tags can carry extra information called **attributes**. An attribute goes inside the opening tag and looks like `name="value"`.' },
        { p: 'A **link** uses the `<a>` tag (for “anchor”). Its `href` attribute holds the address to open. An **image** uses `<img>`: `src` is the address of the image file, and `alt` is a short description for people who can’t see it. Screen readers read it aloud, and it appears if the image fails to load. `<img>` has no closing tag.' },
        {
          lang: 'html',
          code: `<a href="https://developer.mozilla.org">Learn on MDN</a>

<img src="https://picsum.photos/200" alt="A random photo">`
        },
        { p: 'Need a picture to practice with? `https://picsum.photos/200` gives you a random 200×200 photo.' },
        { p: '**Lists** come in two kinds: `<ul>` (unordered list) shows bullets, and `<ol>` (ordered list) shows numbers. Each item goes inside an `<li>` (list item):' },
        {
          lang: 'html',
          code: `<ul>
  <li>Pizza</li>
  <li>Board games</li>
  <li>Rainy Sunday mornings</li>
</ul>`
        },
        { p: 'Elements can live inside each other: a list item can contain a link, and a link can wrap an image. Just close them in the reverse order you opened them: `<li><a href="…">Home</a></li>`.' }
      ],
      lab: {
        goal: 'Fill the list with at least 3 of your favorite things, add a link to any website, and add an image with alt text.',
        success: 'Links, images and lists: you can now build real content.',
        tabs: ['html'],
        starter: {
          html: `<h1>My favorite things</h1>

<ul>
  <!-- Add your <li> items here -->
</ul>

<!-- Add a link and an image below -->
`
        },
        solution: {
          html: `<h1>My favorite things</h1>

<ul>
  <li>Hiking in the mountains</li>
  <li>Chocolate cake</li>
  <li>Science fiction books</li>
</ul>

<p>My favorite website: <a href="https://www.wikipedia.org">Wikipedia</a></p>
<img src="https://picsum.photos/200" alt="A random landscape photo">
`
        },
        hints: [
          'Each item is written `<li>Something</li>` and goes *inside* `<ul>` … `</ul>`.',
          'A link looks like `<a href="https://www.wikipedia.org">Wikipedia</a>`. Don’t forget the quotes around the address.',
          'An image looks like `<img src="https://picsum.photos/200" alt="Describe the picture">`. Remember, `<img>` has no closing tag.'
        ],
        criteria: [
          {
            label: 'The list (`<ul>`) has at least 3 items (`<li>`) with text',
            check: function (doc) {
              return Array.prototype.some.call(doc.querySelectorAll('ul'), function (ul) {
                return Array.prototype.filter.call(ul.querySelectorAll('li'), function (li) {
                  return text(li) !== '';
                }).length >= 3;
              });
            }
          },
          {
            label: 'A link (`<a>`) has an `href` that starts with “http”',
            check: function (doc) {
              return Array.prototype.some.call(doc.querySelectorAll('a[href]'), function (a) {
                return /^http/i.test(a.getAttribute('href').trim());
              });
            }
          },
          {
            label: 'An image (`<img>`) has a non-empty `alt` text',
            check: function (doc) {
              return Array.prototype.some.call(doc.querySelectorAll('img[alt]'), function (img) {
                return img.getAttribute('alt').trim() !== '';
              });
            }
          }
        ]
      }
    },

    /* ===================== STEP 3 ===================== */
    {
      id: 'css-colors-text',
      title: 'CSS colors and text',
      short: 'Colors & text',
      learned: 'CSS rules, selectors, properties and values, and how to set colors (names and hex), font sizes and font weights.',
      lesson: [
        { p: 'HTML says *what* things are; **CSS** (Cascading Style Sheets) says how they *look*. A CSS **rule** has a **selector**, which picks the elements to style, and a block of **declarations**. Each declaration is a **property** and a **value**, ending with a semicolon:' },
        {
          lang: 'css',
          code: `h1 {
  color: navy;
  font-size: 32px;
}`
        },
        {
          ul: [
            '`p` selects every element of that type.',
            '`.btn` selects every element with `class="btn"`.',
            '`#title` selects the one element with `id="title"`.'
          ]
        },
        { p: 'Useful properties for text: `color` (the text color), `background-color` (the color behind the element), `font-size` (often in pixels, like `20px`) and `font-weight`, the thickness: `normal`, `bold`, or a number from `100` to `900`, where `400` is normal and `700` is bold.' },
        { p: 'Colors can be written in several ways:' },
        {
          lang: 'css',
          code: `.note {
  color: tomato;               /* a color name */
  background-color: #fef3c7;   /* hex: #RRGGBB */
}`
        },
        { p: 'A hex color mixes red, green and blue, two digits each, from `00` (none) to `ff` (full). `#000000` is black, `#ffffff` is white and `#ff0000` is pure red. Text between `/*` and `*/` is a comment: the browser ignores it.' }
      ],
      lab: {
        goal: 'Restyle the button in the CSS tab: give it a new background color, make its text bold, and make the font size at least 20px.',
        success: 'Your button has a brand-new look.',
        tabs: ['html', 'css'],
        starter: {
          html: `<button class="btn">Click me</button>
`,
          css: `.btn {
  background-color: #2563eb;
  color: white;
  font-size: 16px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
}
`
        },
        solution: {
          css: `.btn {
  background-color: #16a34a;
  color: white;
  font-size: 22px;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
}
`
        },
        hints: [
          'Change the value after `background-color:`. Try a color name like `crimson` or a hex code like `#16a34a`.',
          'Add a new line inside the braces: `font-weight: bold;`',
          'Change `font-size: 16px;` to something bigger, like `22px`.'
        ],
        criteria: [
          {
            label: 'The button has a new background color (not the original blue)',
            check: function (doc, win) {
              var btn = doc.querySelector('.btn') || doc.querySelector('button');
              if (!btn) return false;
              var c = rgba(win.getComputedStyle(btn).backgroundColor);
              return !(c.r === 37 && c.g === 99 && c.b === 235 && c.a === 1);
            }
          },
          {
            label: 'The text is bold (`font-weight` of 600 or more)',
            check: function (doc, win) {
              var btn = doc.querySelector('.btn') || doc.querySelector('button');
              return !!btn && parseInt(win.getComputedStyle(btn).fontWeight, 10) >= 600;
            }
          },
          {
            label: 'The font size is at least 20px',
            check: function (doc, win) {
              var btn = doc.querySelector('.btn') || doc.querySelector('button');
              return !!btn && px(win.getComputedStyle(btn).fontSize) >= 20;
            }
          }
        ]
      }
    },

    /* ===================== STEP 4 ===================== */
    {
      id: 'box-model',
      title: 'The box model',
      short: 'Box model',
      learned: 'The box model (content, padding, border and margin) and rounded corners with `border-radius`.',
      lesson: [
        { p: 'To the browser, every element is a rectangular **box** made of four layers, from the inside out:' },
        {
          html: '<div class="boxmodel" role="img" aria-label="Box model diagram: the content sits in the middle, surrounded by padding, then the border, then the margin on the outside.">' +
            '<div class="bm-layer bm-margin"><span class="bm-label">margin</span>' +
            '<div class="bm-layer bm-border"><span class="bm-label">border</span>' +
            '<div class="bm-layer bm-padding"><span class="bm-label">padding</span>' +
            '<div class="bm-content">content</div>' +
            '</div></div></div></div>'
        },
        {
          ul: [
            '**Content**: the text or image itself.',
            '**Padding**: space *inside* the box, between the content and the border. It shows the element’s background color.',
            '**Border**: a line drawn around the padding.',
            '**Margin**: space *outside* the border that pushes other elements away. It is always transparent.'
          ]
        },
        {
          lang: 'css',
          code: `.note {
  padding: 16px;             /* all four sides */
  border: 2px solid #333;    /* width, style, color */
  border-radius: 12px;       /* rounded corners */
  margin: 24px 0;            /* top & bottom, left & right */
  background-color: #f5f5f5;
}`
        },
        { p: '`padding` and `margin` take one value for all sides, two for vertical then horizontal, or four going clockwise from the top. You can also set one side, like `padding-top` or `margin-left`.' },
        { p: 'The `border` shorthand needs a width, a style (`solid`, `dashed`, `dotted`…) and a color. Without a style, no border is drawn at all! `border-radius` rounds the corners: `8px` gives soft corners, and `50%` turns a square into a circle.' },
        { p: 'Tip: right-click any element in your browser and choose **Inspect**. The developer tools draw its box model just like the diagram above.' }
      ],
      lab: {
        goal: 'The `.card` has no styling yet. In the CSS tab, give it padding (at least 16px), a border, rounded corners (at least 8px) and a background color.',
        success: 'That’s a proper card: content, padding, border and all.',
        tabs: ['html', 'css'],
        starter: {
          html: `<div class="card">
  <h2>Mount Everest</h2>
  <p>The highest mountain on Earth, at 8,849 meters above sea level.</p>
</div>
`,
          css: `/* Style the card here */
.card {

}
`
        },
        solution: {
          css: `/* Style the card here */
.card {
  max-width: 320px;
  padding: 20px;
  border: 1px solid #d4d4d4;
  border-radius: 12px;
  background-color: #fffbeb;
}
`
        },
        hints: [
          '`padding: 20px;` adds space on all four sides at once.',
          'A border needs a width, a style and a color: `border: 1px solid #d4d4d4;`',
          'Round the corners with `border-radius: 12px;` and add a color with `background-color: #fffbeb;`'
        ],
        criteria: [
          {
            label: 'The card has at least 16px of padding on every side',
            check: function (doc, win) {
              var card = doc.querySelector('.card');
              if (!card) return false;
              var cs = win.getComputedStyle(card);
              return SIDES.every(function (s) { return px(cs['padding' + s]) >= 16; });
            }
          },
          {
            label: 'The card has a visible border on every side (at least 1px, style not `none`)',
            check: function (doc, win) {
              var card = doc.querySelector('.card');
              if (!card) return false;
              var cs = win.getComputedStyle(card);
              return SIDES.every(function (s) {
                var style = cs['border' + s + 'Style'];
                return px(cs['border' + s + 'Width']) >= 1 && style !== 'none' && style !== 'hidden';
              });
            }
          },
          {
            label: 'The corners are rounded (`border-radius` of at least 8px)',
            check: function (doc, win) {
              var card = doc.querySelector('.card');
              if (!card) return false;
              var cs = win.getComputedStyle(card);
              var rect = card.getBoundingClientRect();
              return ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].every(function (c) {
                return radius(cs['border' + c + 'Radius'], rect) >= 8;
              });
            }
          },
          {
            label: 'The card has a background color (not transparent)',
            check: function (doc, win) {
              var card = doc.querySelector('.card');
              return !!card && rgba(win.getComputedStyle(card).backgroundColor).a > 0;
            }
          }
        ]
      }
    },

    /* ===================== STEP 5 ===================== */
    {
      id: 'flexbox',
      title: 'Layout with Flexbox',
      short: 'Flexbox',
      learned: 'Flexbox layout with `display: flex`, `flex-direction`, `justify-content`, `align-items` and `gap`.',
      lesson: [
        { p: 'By default, block elements like `<div>` stack on top of each other. **Flexbox** lets a parent arrange its children in a row or a column. Add `display: flex` to the **parent** (the *flex container*), and its direct children become *flex items*:' },
        {
          lang: 'html',
          code: `<nav class="menu">
  <a href="#">Home</a>
  <a href="#">Blog</a>
  <a href="#">Contact</a>
</nav>`
        },
        {
          lang: 'css',
          code: `.menu {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}`
        },
        { p: 'With this CSS, the three links sit side by side in the middle of the menu, 12px apart. All these properties go on the **container**:' },
        {
          ul: [
            '`flex-direction`: `row` (the default, left to right) or `column` (top to bottom).',
            '`justify-content`: how items are spread along that direction: `flex-start`, `center`, `flex-end`, `space-between` (space only between items), `space-around` or `space-evenly`.',
            '`align-items`: how items line up across it: `stretch` (the default), `flex-start`, `center` or `flex-end`.',
            '`gap`: the space between items, like `gap: 16px`. Much easier than adding margins to every item!'
          ]
        },
        { p: 'Remember: flex properties go on the container, not on the items inside it. Flexbox is perfect for one line of things: menus, toolbars, rows of cards or buttons.' }
      ],
      lab: {
        goal: 'The three boxes are stacked on top of each other. Use Flexbox on `.row` to place them side by side, with at least 10px of space between them, centered horizontally.',
        success: 'Three boxes, one row, nicely spaced. You’ve got Flexbox!',
        tabs: ['html', 'css'],
        starter: {
          html: `<div class="row">
  <div class="box red">A</div>
  <div class="box green">B</div>
  <div class="box purple">C</div>
</div>
`,
          css: `.row {
  /* Your Flexbox code goes here */
  border: 2px dashed #9ca3af;
  padding: 10px;
}

.box {
  width: 70px;
  height: 70px;
  color: white;
  font-size: 24px;
  font-weight: bold;
  line-height: 70px;
  text-align: center;
  border-radius: 8px;
}

.red    { background-color: #ef4444; }
.green  { background-color: #16a34a; }
.purple { background-color: #8b5cf6; }
`
        },
        solution: {
          css: `.row {
  display: flex;
  justify-content: center;
  gap: 16px;
  border: 2px dashed #9ca3af;
  padding: 10px;
}

.box {
  width: 70px;
  height: 70px;
  color: white;
  font-size: 24px;
  font-weight: bold;
  line-height: 70px;
  text-align: center;
  border-radius: 8px;
}

.red    { background-color: #ef4444; }
.green  { background-color: #16a34a; }
.purple { background-color: #8b5cf6; }
`
        },
        hints: [
          'Add `display: flex;` inside the `.row { }` rule. Watch the boxes jump into one row!',
          'Add space between them with `gap: 16px;` on `.row`.',
          'Center them with `justify-content: center;` on `.row`.'
        ],
        criteria: [
          {
            label: '`.row` uses `display: flex`',
            check: function (doc, win) {
              var row = doc.querySelector('.row');
              if (!row) return false;
              var d = win.getComputedStyle(row).display;
              return d === 'flex' || d === 'inline-flex';
            }
          },
          {
            label: 'All three boxes sit side by side in one row',
            check: function (doc) {
              var boxes = doc.querySelectorAll('.row .box');
              if (boxes.length < 3) return false;
              var rects = Array.prototype.map.call(boxes, function (b) { return b.getBoundingClientRect(); });
              var first = rects[0];
              return rects.every(function (r, i) {
                var sameRow = r.top < first.bottom && r.bottom > first.top;
                var afterPrevious = i === 0 || r.left >= rects[i - 1].right - 1;
                return sameRow && afterPrevious;
              });
            }
          },
          {
            label: 'There are at least 10px between the boxes (with `gap` or margins)',
            check: function (doc, win) {
              var row = doc.querySelector('.row');
              var boxes = doc.querySelectorAll('.row .box');
              if (!row || boxes.length < 3) return false;
              var gap = px(win.getComputedStyle(row).columnGap);
              for (var i = 1; i < boxes.length; i++) {
                var space = gap +
                  px(win.getComputedStyle(boxes[i - 1]).marginRight) +
                  px(win.getComputedStyle(boxes[i]).marginLeft);
                if (space < 10) return false;
              }
              return true;
            }
          },
          {
            label: '`justify-content` is `center`, `space-between`, `space-around` or `space-evenly`',
            check: function (doc, win) {
              var row = doc.querySelector('.row');
              if (!row) return false;
              var jc = win.getComputedStyle(row).justifyContent.replace(/^(un)?safe\s+/, '');
              return ['center', 'space-between', 'space-around', 'space-evenly'].indexOf(jc) !== -1;
            }
          }
        ]
      }
    },

    /* ===================== STEP 6 ===================== */
    {
      id: 'js-clicks',
      title: 'JavaScript: responding to clicks',
      short: 'Clicks',
      learned: 'Finding elements with `document.querySelector`, reacting to clicks with `addEventListener`, and changing text with `textContent`.',
      lesson: [
        { p: 'HTML builds the page and CSS styles it. **JavaScript** makes it *react*: to clicks, typing, timers… It can read and change any element while the page is open. Reacting to a click takes three steps:' },
        {
          ol: [
            '**Find** the element with `document.querySelector()`. It takes the same selectors as CSS: `\'#msg\'` for an id, `\'.btn\'` for a class.',
            '**Listen** for an event with `addEventListener()`. Give it the event name, `\'click\'`, and a **function**: the code to run when it happens.',
            '**Change** something, for example the text inside an element with `textContent`.'
          ]
        },
        {
          lang: 'js',
          code: `const button = document.querySelector('#hello');
const title = document.querySelector('h1');

button.addEventListener('click', function () {
  title.textContent = 'You clicked!';
});`
        },
        { p: '`const` creates a **variable**: a name for a value you want to use later. Here, `button` and `title` remember the elements we found.' },
        { p: 'The code inside `function () { … }` does not run right away. It runs *each time* the button is clicked.' },
        { p: 'If something goes wrong, read the error message under the preview. A message mentioning `null` usually means `querySelector` found nothing: check the spelling, and the `#` or `.` in front of the name.' }
      ],
      lab: {
        goal: 'In the JS tab, write code so that clicking the **Say hi** button changes the text of the paragraph `#msg`.',
        success: 'Your page reacts to clicks. That’s JavaScript in action!',
        tabs: ['html', 'js'],
        freshPageForEachCheck: true,
        starter: {
          html: `<button id="btn">Say hi</button>
<p id="msg">The button hasn’t been clicked yet.</p>
`,
          js: `// Goal: when the button #btn is clicked,
// change the text of the paragraph #msg.
//
// 1. Find the button and the paragraph with document.querySelector
// 2. Listen for a 'click' on the button with addEventListener
// 3. Inside the function, change the paragraph's textContent

`
        },
        solution: {
          js: `const btn = document.querySelector('#btn');
const msg = document.querySelector('#msg');

btn.addEventListener('click', function () {
  msg.textContent = 'Hi there! Nice to meet you.';
});
`
        },
        hints: [
          'Start by finding both elements: `const btn = document.querySelector(\'#btn\');` and the same for `#msg`.',
          'Then listen for clicks: `btn.addEventListener(\'click\', function () { … });`',
          'Inside the function, change the text: `msg.textContent = \'Hi there!\';`'
        ],
        criteria: [
          {
            label: 'The page still has a button `#btn` and a paragraph `#msg`',
            check: function (doc) {
              return !!doc.querySelector('#btn') && !!doc.querySelector('#msg');
            }
          },
          {
            label: 'Clicking `#btn` changes the text of `#msg` to something new (and not empty)',
            check: function (doc) {
              var btn = doc.querySelector('#btn');
              var msg = doc.querySelector('#msg');
              if (!btn || !msg) return false;
              var before = text(msg);
              btn.click();
              var after = text(doc.querySelector('#msg'));
              return after !== '' && after !== before;
            }
          }
        ]
      }
    },

    /* ===================== STEP 7 ===================== */
    {
      id: 'js-classes',
      title: 'JavaScript: changing styles and classes',
      short: 'Classes',
      learned: 'Switching styles from JavaScript with `classList.add`, `remove` and `toggle`, and how HTML, CSS and JavaScript work together.',
      lesson: [
        { p: 'Every element has a `classList` that lets JavaScript manage its CSS classes:' },
        {
          lang: 'js',
          code: `element.classList.add('dark');      // add the class
element.classList.remove('dark');   // remove it
element.classList.toggle('dark');   // add it if missing, remove it if present`
        },
        { p: 'You *could* change a style directly with `element.style.backgroundColor = \'black\'`, but toggling a class is usually better:' },
        {
          ul: [
            'The **looks** stay in CSS, where they belong. JavaScript only decides *which state* the page is in.',
            'One class can change many properties, on many elements, at once.',
            'Going back is easy: remove the class. No need to remember the old values.'
          ]
        },
        {
          lang: 'css',
          code: `body.dark {
  background-color: #111827;
  color: #f9fafb;
}`
        },
        { h: 'Recap: three languages, one page' },
        {
          ul: [
            '**HTML** creates the content: a title, a paragraph, a button.',
            '**CSS** describes how it looks, including how it looks in the `.dark` state.',
            '**JavaScript** listens for the click and switches between states by toggling a class.'
          ]
        },
        { p: 'Handy shortcut: `document.body` gives you the `<body>` element directly, no `querySelector` needed. And if you ever need to know the current state, `element.classList.contains(\'dark\')` answers with `true` or `false`.' },
        { p: 'This is how most real websites work: menus that open, tabs that switch, dark mode buttons. CSS prepares the looks, and JavaScript flips the switch.' }
      ],
      lab: {
        goal: 'Make the **Toggle dark mode** button switch dark mode on and off by toggling the class `dark` on `<body>`. The CSS is ready: you only need to write the JavaScript.',
        success: 'HTML, CSS and JavaScript working together: you built a dark mode switch!',
        tabs: ['html', 'css', 'js'],
        freshPageForEachCheck: true,
        starter: {
          html: `<h1>My little page</h1>
<p>Click the button to switch between light and dark mode.</p>
<button id="toggle">Toggle dark mode</button>
`,
          css: `body {
  font-family: sans-serif;
  background-color: #ffffff;
  color: #1f2937;
  padding: 24px;
}

/* Dark mode: used when <body> has the class "dark" */
body.dark {
  background-color: #111827;
  color: #f9fafb;
}

button {
  font-size: 16px;
  padding: 8px 16px;
  cursor: pointer;
}
`,
          js: `// Goal: when #toggle is clicked, toggle the class "dark" on <body>.
// Tip: document.body gives you the <body> element.

`
        },
        solution: {
          js: `const toggle = document.querySelector('#toggle');

toggle.addEventListener('click', function () {
  document.body.classList.toggle('dark');
});
`
        },
        hints: [
          'Find the button first: `const toggle = document.querySelector(\'#toggle\');`',
          'Listen for clicks: `toggle.addEventListener(\'click\', function () { … });`',
          'Inside the function, one line does it all: `document.body.classList.toggle(\'dark\');`'
        ],
        criteria: [
          {
            label: 'One click turns dark mode on: `<body>` gets the class `dark` and a dark background',
            check: function (doc, win) {
              var btn = doc.querySelector('#toggle') || doc.querySelector('button');
              if (!btn || doc.body.classList.contains('dark')) return false;
              btn.click();
              return doc.body.classList.contains('dark') &&
                luminance(win.getComputedStyle(doc.body).backgroundColor) < 0.3;
            }
          },
          {
            label: 'A second click turns dark mode off again',
            check: function (doc) {
              var btn = doc.querySelector('#toggle') || doc.querySelector('button');
              if (!btn) return false;
              btn.click();
              if (!doc.body.classList.contains('dark')) return false;
              btn.click();
              return !doc.body.classList.contains('dark');
            }
          }
        ]
      }
    }
  ];

  /* ---------- Start here: the parts of a showcase website ---------- */

  var intro = {
    eyebrow: 'Start here',
    title: 'Anatomy of a showcase website',
    short: 'Website anatomy',
    next: { label: 'Start Step 1 →', href: '#step-1' },
    lesson: [
      { p: 'Before writing any code, let’s look at what we are building towards. Almost every showcase website, whether it’s a portfolio, a restaurant or a small business, is made of the same four parts:' },
      {
        html: '<div class="wireframe" role="img" aria-label="Wireframe of a showcase website: 1, a header with a logo and a menu. 2, a hero with a big headline and a Get a quote button. 3, a row of three project cards. 4, a footer with copyright and links.">' +
          '<div class="wf-bar"><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-dot"></span><span class="wf-url">studio.com</span></div>' +
          '<div class="wf-row wf-header"><span class="wf-num">1</span><span class="wf-logo">LOGO</span><span class="wf-nav"><span>Home</span><span>Work</span><span>About</span><span>Contact</span></span></div>' +
          '<div class="wf-row wf-hero"><span class="wf-num">2</span><div class="wf-hero-body"><div class="wf-headline">We design websites people love</div><span class="wf-cta">Get a quote</span></div></div>' +
          '<div class="wf-row wf-sections"><span class="wf-num">3</span><div class="wf-cards"><div class="wf-card"><span class="wf-img"></span>Project</div><div class="wf-card"><span class="wf-img"></span>Project</div><div class="wf-card"><span class="wf-img"></span>Project</div></div></div>' +
          '<div class="wf-row wf-footer"><span class="wf-num">4</span><span>© 2026 Studio</span><span class="wf-footer-links">Privacy · Instagram</span></div>' +
          '</div>'
      },
      {
        ol: [
          '**Header**: the logo and the menu. It is the same on every page, so visitors never get lost.',
          '**Hero**: the big first screen. One clear headline that says what you do, and *one* main action: “Get a quote”, “Book a table”, “See my work”.',
          '**Content sections**: what you offer, projects shown as cards, an “about” section, testimonials.',
          '**Footer**: the bottom strip with contact details, legal links and social media.'
        ]
      },
      { h2: 'Each part has its own HTML tag' },
      { p: 'These **semantic** tags look exactly like a plain `<div>` on screen, but they tell browsers, search engines and screen readers what each part *is*. A blind visitor can jump straight to the menu or the main content.' },
      {
        table: {
          head: ['Part', 'HTML tag', 'What goes in it'],
          rows: [
            ['Header', '`<header>`, `<nav>`', 'Logo and menu links'],
            ['Hero', '`<section>`', 'Headline, short text, one button'],
            ['Content', '`<main>`, `<section>`', 'Services, projects, about'],
            ['Card', '`<article>`', 'One project, product or review'],
            ['Call to action', '`<a>`, `<button>`', '“Contact us”, “Get a quote”'],
            ['Footer', '`<footer>`', 'Contact, legal links, social media']
          ]
        }
      },
      { h2: 'The skeleton of a showcase page' },
      {
        lang: 'html',
        code: `<body>
  <header>
    <nav>…</nav>
  </header>
  <main>
    <section class="hero">…</section>
    <section class="projects">…</section>
  </main>
  <footer>…</footer>
</body>`
      },
      { h2: 'Where you’ll learn each piece' },
      {
        ol: [
          '[Step 1](#step-1): the headings and text.',
          '[Step 2](#step-2): the menu links and the images.',
          '[Step 3](#step-3): colors and buttons.',
          '[Step 4](#step-4): the project cards (padding, borders, rounded corners).',
          '[Step 5](#step-5): the logo and menu side by side in the header, cards in a row.',
          '[Step 6](#step-6): buttons that react to clicks.',
          '[Step 7](#step-7): a dark mode switch.'
        ]
      },
      { p: 'By the end of the workshop you’ll know every ingredient of a showcase website. Let’s start!' }
    ]
  };

  /* ---------- Going further: Tailwind, Bootstrap, React ---------- */

  var CDN = {
    tailwind: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11/dist/index.global.js',
    bootstrap: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    react: 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
    reactDom: 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
    babel: 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js'
  };

  function reactDemo(css, code, root) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<script src="' + CDN.react + '"><\/script>' +
      '<script src="' + CDN.reactDom + '"><\/script>' +
      '<script src="' + CDN.babel + '"><\/script>' +
      '<style>body { font-family: system-ui, sans-serif; padding: 16px; margin: 0; } ' + css + '</style>' +
      '</head><body><div id="root"></div>' +
      '<script type="text/babel">\nconst { useState } = React;\n' + code +
      '\nReactDOM.createRoot(document.getElementById("root")).render(' + root + ');\n<\/script>' +
      '</body></html>';
  }

  var SAY_HI_JSX = `function SayHi() {
  const [msg, setMsg] = useState('Hello');

  return (
    <div>
      <button onClick={function () {
        setMsg('Hi there!');
      }}>Say hi</button>
      <p>{msg}</p>
    </div>
  );
}`;

  var CARDS_JSX = `function Card({ title, height }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{height}</p>
    </div>
  );
}

function App() {
  return (
    <main>
      <Card title="Everest" height="8,849 m" />
      <Card title="K2" height="8,611 m" />
      <Card title="Kangchenjunga" height="8,586 m" />
    </main>
  );
}`;

  var beyond = {
    eyebrow: 'After the workshop',
    title: 'Going further: Tailwind, Bootstrap and React',
    short: 'Going further',
    next: { label: 'See your wrap-up →', href: '#finish' },
    lesson: [
      { p: 'Today you wrote everything by hand, and that’s the best way to learn. In real projects, developers use tools that save time on the repetitive parts. Here are the three you’ll hear about most, each shown on something you built today.' },
      { p: '**They don’t replace HTML, CSS and JavaScript: they are made of them.** Everything you learned still applies.' },

      { h2: 'Tailwind CSS: style without leaving your HTML' },
      { p: 'Tailwind is a CSS framework. Instead of writing CSS rules in a separate file, you add small ready-made classes directly in your HTML. Here is the card from Step 4, both ways:' },
      {
        compare: [
          {
            label: 'Today: CSS + HTML',
            parts: [
              {
                lang: 'css',
                code: `.card {
  padding: 20px;
  border: 1px solid #d4d4d4;
  border-radius: 12px;
  background-color: #fffbeb;
}`
              },
              { lang: 'html', code: '<div class="card">…</div>' }
            ]
          },
          {
            label: 'With Tailwind: HTML only',
            parts: [
              {
                lang: 'html',
                code: `<div class="p-5 border
            border-neutral-300
            rounded-xl
            bg-amber-50">
  …
</div>`
              }
            ]
          }
        ]
      },
      {
        ul: [
          'Each class is one CSS rule: `p-5` is `padding: 20px`, `rounded-xl` is `border-radius: 12px`, `bg-amber-50` is a very light yellow background.',
          'The Flexbox row from Step 5 becomes `class="flex justify-center gap-4"`.',
          'Spacing and colors come from a fixed scale, so the whole site stays consistent.'
        ]
      },
      {
        demo: {
          title: 'Live result: Tailwind',
          note: 'Loads Tailwind from the internet.',
          height: 300,
          html: '<!DOCTYPE html><html><head><meta charset="utf-8"><script src="' + CDN.tailwind + '"><\/script></head>' +
            '<body class="p-6 font-sans">' +
            '<div class="p-5 border border-neutral-300 rounded-xl bg-amber-50 max-w-xs">' +
            '<h2 class="text-xl font-bold">Mount Everest</h2>' +
            '<p class="mt-2">The highest mountain on Earth, at 8,849 meters.</p></div>' +
            '<div class="flex justify-center gap-4 mt-6">' +
            '<div class="w-16 h-16 rounded-lg bg-red-500 text-white font-bold grid place-items-center">A</div>' +
            '<div class="w-16 h-16 rounded-lg bg-green-600 text-white font-bold grid place-items-center">B</div>' +
            '<div class="w-16 h-16 rounded-lg bg-violet-500 text-white font-bold grid place-items-center">C</div>' +
            '</div></body></html>'
        }
      },

      { h2: 'Bootstrap: components that are already designed' },
      { p: 'Bootstrap gives you complete, ready-made components. Add its stylesheet with one `<link>`, then use its class names: no CSS to write. Here are the button from Step 6 and the card from Step 4, plus a dark mode switch like Step 7:' },
      {
        compare: [
          {
            label: 'HTML',
            parts: [
              {
                lang: 'html',
                code: `<button class="btn btn-primary">Say hi</button>
<button class="btn btn-outline-secondary" id="theme">
  Toggle dark mode
</button>

<div class="card">
  <div class="card-body">
    <h5 class="card-title">Everest</h5>
    <p class="card-text">8,849 m</p>
  </div>
</div>`
              }
            ]
          },
          {
            label: 'JS: Bootstrap’s built-in dark mode',
            parts: [
              {
                lang: 'js',
                code: `const theme = document.querySelector('#theme');
const page = document.documentElement;

theme.addEventListener('click', function () {
  if (page.dataset.bsTheme === 'dark') {
    page.dataset.bsTheme = 'light';
  } else {
    page.dataset.bsTheme = 'dark';
  }
});`
              }
            ]
          }
        ]
      },
      {
        ul: [
          '**Ready-made parts**: buttons, cards, forms, pop-up windows, and a navigation bar that folds into a “burger” menu on phones.',
          '**A responsive grid**: rows and columns that rearrange themselves on small screens.',
          '**Dark mode built in**: `data-bs-theme="dark"` on the `<html>` tag switches every component.'
        ]
      },
      {
        demo: {
          title: 'Live result: Bootstrap',
          note: 'Loads Bootstrap from the internet. Try the dark mode button!',
          height: 280,
          html: '<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="' + CDN.bootstrap + '"></head>' +
            '<body class="p-4">' +
            '<button class="btn btn-primary">Say hi</button> ' +
            '<button class="btn btn-outline-secondary" id="theme">Toggle dark mode</button>' +
            '<div class="card mt-3" style="max-width: 18rem;"><div class="card-body">' +
            '<h5 class="card-title">Everest</h5><p class="card-text">8,849 m</p></div></div>' +
            '<script>var theme = document.querySelector("#theme"); var page = document.documentElement;' +
            'theme.addEventListener("click", function () { page.dataset.bsTheme = page.dataset.bsTheme === "dark" ? "light" : "dark"; });<\/script>' +
            '</body></html>'
        }
      },

      { h2: 'React: describe the page, React updates it' },
      { p: 'React is a JavaScript library for building interfaces, and the most important of the three to learn next if you want to build web applications. Here is the button from Step 6, first the way you wrote it today, then in React:' },
      {
        compare: [
          {
            label: 'Today: HTML + JS',
            parts: [
              {
                lang: 'html',
                code: `<button id="btn">Say hi</button>
<p id="msg">Hello</p>`
              },
              {
                lang: 'js',
                code: `const btn = document.querySelector('#btn');
const msg = document.querySelector('#msg');

btn.addEventListener('click', function () {
  msg.textContent = 'Hi there!';
});`
              }
            ]
          },
          {
            label: 'React: one component',
            parts: [
              { lang: 'jsx', code: 'import { useState } from \'react\';\n\n' + SAY_HI_JSX }
            ]
          }
        ]
      },
      {
        ul: [
          'A **component** is a function whose name starts with a capital letter, like `SayHi`.',
          '`useState(\'Hello\')` creates a piece of **state**: a value React remembers. `msg` is the current value, `setMsg` changes it.',
          'The HTML inside JavaScript is called **JSX**. `{msg}` means “put the value of msg here”.',
          '`onClick` replaces `addEventListener`, with the same `function () { … }` you wrote in Step 6.'
        ]
      },
      { p: 'No `querySelector`, no `textContent`: you describe what the page looks like for each state, and when the state changes, React updates the page for you. In a big app where dozens of things change at once, that saves a lot of bugs.' },
      {
        demo: {
          title: 'Live result: React',
          note: 'Loads React and a JSX compiler (about 3 MB) from the internet.',
          height: 160,
          html: reactDemo('button { font-size: 16px; padding: 8px 16px; }', SAY_HI_JSX, '<SayHi />')
        }
      },

      { h2: 'React components: write a part once, reuse it everywhere' },
      { p: 'Remember the [anatomy of a showcase website](#intro)? In React, each part (header, card, footer) becomes a **component**: your own custom HTML tag. Its **props** work like the attributes from Step 2.' },
      { lang: 'jsx', code: CARDS_JSX },
      {
        ul: [
          'Write `Card` once, use it as many times as you like. Change it, and every card updates.',
          'A whole site becomes a tree of components: `<Header />`, `<Card />`, `<Footer />`… The header is written once and shared by every page.',
          'Two small differences from HTML: `className` instead of `class`, and a tag with no content closes itself: `<Card />`.'
        ]
      },
      {
        demo: {
          title: 'Live result: React components',
          note: 'Loads React and a JSX compiler (about 3 MB) from the internet.',
          height: 200,
          html: reactDemo(
            'main { display: flex; flex-wrap: wrap; gap: 16px; } .card { padding: 16px 20px; border: 1px solid #d4d4d4; border-radius: 12px; background-color: #fffbeb; } .card h2 { margin: 0 0 4px; font-size: 20px; } .card p { margin: 0; }',
            CARDS_JSX,
            '<App />'
          )
        }
      },

      { h2: 'Try them at home' },
      {
        ul: [
          '**Tailwind**: [play.tailwindcss.com](https://play.tailwindcss.com) runs Tailwind in your browser. Nothing to install.',
          '**Bootstrap**: copy the stylesheet `<link>` from [getbootstrap.com](https://getbootstrap.com) into today’s page and try the `btn` and `card` classes.',
          '**React**: install [Node.js](https://nodejs.org), run `npm create vite@latest` in a terminal, pick React, then follow the official tutorial at [react.dev/learn](https://react.dev/learn).'
        ]
      },
      { p: 'A good path: rebuild today’s page with Bootstrap, restyle it with Tailwind, then turn its parts into React components.' }
    ]
  };

  window.WORKSHOP = {
    steps: steps,
    intro: intro,
    beyond: beyond,
    finish: {
      title: 'You built your first interactive web page!',
      intro: 'You started with a single “Hello World”. Now you can structure content with HTML, style it with CSS, lay it out with Flexbox and make it react with JavaScript. That’s the foundation of every website out there.',
      links: [
        {
          title: 'MDN: Learn web development',
          url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
          text: 'A free, complete course that picks up right where this workshop ends.'
        },
        {
          title: 'HTML reference',
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
          text: 'Every HTML element and attribute, with examples.'
        },
        {
          title: 'CSS reference',
          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
          text: 'All the properties, selectors and values you can use.'
        },
        {
          title: 'The box model',
          url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model',
          text: 'A deeper look at padding, borders and margins.'
        },
        {
          title: 'Flexbox',
          url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox',
          text: 'Wrapping, growing and shrinking flex items.'
        },
        {
          title: 'JavaScript guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          text: 'Variables, functions, loops and more.'
        },
        {
          title: 'Manipulating documents (the DOM)',
          url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting',
          text: 'Create, change and remove elements with JavaScript.'
        }
      ]
    }
  };
})();
