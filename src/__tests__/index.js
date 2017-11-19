import test from 'ava';
import postcss from 'postcss';
import vars from 'postcss-simple-vars';
import comments from 'postcss-discard-comments';
import {name} from '../../package.json';
import plugin from '..';
import {pseudoElements} from '../lib/ensureCompatibility';

function testOutput (t, input, expected, options) {
    if (!expected) {
        expected = input;
    }
    return postcss(plugin).process(input, options).then(result => {
        t.deepEqual(result.css, expected);
    });
}

test(
    'should merge based on declarations',
    testOutput,
    'h1{display:block}h2{display:block}',
    'h1,h2{display:block}'
);

test(
    'should merge based on declarations (2)',
    testOutput,
    'h1{color:red;line-height:1.5;font-size:2em}h2{color:red;line-height:1.5;font-size:2em}',
    'h1,h2{color:red;line-height:1.5;font-size:2em}'
);

test(
    'should merge based on declarations, with a different property order',
    testOutput,
    'h1{color:red;line-height:1.5;font-size:2em}h2{font-size:2em;color:red;line-height:1.5}',
    'h1,h2{color:red;line-height:1.5;font-size:2em}'
);

test(
    'should merge based on selectors',
    testOutput,
    'h1{display:block}h1{text-decoration:underline}',
    'h1{display:block;text-decoration:underline}'
);

test(
    'should merge based on selectors (2)',
    testOutput,
    'h1{color:red;display:block}h1{text-decoration:underline}',
    'h1{color:red;display:block;text-decoration:underline}'
);

test(
    'should merge based on selectors (3)',
    testOutput,
    'h1{font-size:2em;color:#000}h1{background:#fff;line-height:1.5}',
    'h1{font-size:2em;color:#000;background:#fff;line-height:1.5}'
);

test(
    'should merge in media queries',
    testOutput,
    '@media print{h1{display:block}h1{color:red}}',
    '@media print{h1{display:block;color:red}}'
);

test(
    'should merge in media queries (2)',
    testOutput,
    '@media print{h1{display:block}p{display:block}}',
    '@media print{h1,p{display:block}}'
);

test(
    'should merge in media queries (3)',
    testOutput,
    '@media print{h1{color:red;text-decoration:none}h2{text-decoration:none}}h3{text-decoration:none}',
    '@media print{h1{color:red}h1,h2{text-decoration:none}}h3{text-decoration:none}'
);

test(
    'should merge in media queries (4)',
    testOutput,
    'h3{text-decoration:none}@media print{h1{color:red;text-decoration:none}h2{text-decoration:none}}',
    'h3{text-decoration:none}@media print{h1{color:red}h1,h2{text-decoration:none}}'
);

test(
    'should not merge across media queries',
    testOutput,
    '@media screen and (max-width:480px){h1{display:block}}@media screen and (min-width:480px){h2{display:block}}'
);

test(
    'should not merge across media queries (2)',
    testOutput,
    '@media screen and (max-width:200px){h1{color:red}}@media screen and (min-width:480px){h1{display:block}}'
);

test(
    'should not merge across keyframes',
    testOutput,
    '@-webkit-keyframes test{0%{color:#000}to{color:#fff}}@keyframes test{0%{color:#000}to{color:#fff}}'
);

test(
    'should not merge across keyframes (2)',
    testOutput,
    [
        '@-webkit-keyframes slideInDown{',
        '0%{-webkit-transform:translateY(-100%);transform:translateY(-100%);visibility:visible}',
        'to{-webkit-transform:translateY(0);transform:translateY(0)}',
        '}',
        '@keyframes slideInDown{',
        '0%{-webkit-transform:translateY(-100%);transform:translateY(-100%);visibility:visible}',
        'to{-webkit-transform:translateY(0);transform:translateY(0)}',
        '}',
    ].join('')
);

test(
    'should not merge across keyframes (3)',
    testOutput,
    [
        '#foo {-webkit-animation-name:some-animation;-moz-animation-name:some-animation;-o-animation-name:some-animation;animation-name:some-animation}',
        '@-webkit-keyframes some-animation{100%{-webkit-transform:scale(2);transform:scale(2)}}',
        '@-moz-keyframes some-animation{100%{-moz-transform:scale(2);transform:scale(2)}}',
        '@-o-keyframes some-animation {100%{-o-transform:scale(2);transform:scale(2)}}',
        '@keyframes some-animation {100%{-webkit-transform:scale(2);-moz-transform:scale(2);-o-transform:scale(2);transform:scale(2)}}',
    ].join('')
);

test(
    'should not merge in different contexts',
    testOutput,
    'h1{display:block}@media print{h1{color:red}}'
);

test(
    'should not merge in different contexts (2)',
    testOutput,
    '@media print{h1{display:block}}h1{color:red}'
);

test(
    'should perform partial merging of selectors',
    testOutput,
    'h1{color:red}h2{color:red;text-decoration:underline}',
    'h1,h2{color:red}h2{text-decoration:underline}'
);

test(
    'should perform partial merging of selectors (2)',
    testOutput,
    'h1{color:red}h2{color:red;text-decoration:underline}h3{color:green;text-decoration:underline}',
    'h1,h2{color:red}h2,h3{text-decoration:underline}h3{color:green}'
);

test(
    'should perform partial merging of selectors (3)',
    testOutput,
    'h1{color:red;text-decoration:underline}h2{text-decoration:underline;color:green}h3{font-weight:bold;color:green}',
    'h1{color:red}h1,h2{text-decoration:underline}h2,h3{color:green}h3{font-weight:bold}'
);

test(
    'should perform partial merging of selectors (4)',
    testOutput,
    '.test0{color:red;border:none;margin:0}.test1{color:green;border:none;margin:0}',
    '.test0{color:red}.test0,.test1{border:none;margin:0}.test1{color:green}'
);

test(
    'should perform partial merging of selectors (5)',
    testOutput,
    'h1{color:red;font-weight:bold}h2{font-weight:bold}h3{text-decoration:none}',
    'h1{color:red}h1,h2{font-weight:bold}h3{text-decoration:none}'
);

test(
    'should perform partial merging of selectors (6)',
    testOutput,
    '.test-1,.test-2{margin-top:10px}.another-test{margin-top:10px;margin-bottom:30px}',
    '.test-1,.test-2,.another-test{margin-top:10px}.another-test{margin-bottom:30px}'
);

test(
    'should perform partial merging of selectors (7)',
    testOutput,
    '.test-1{margin-top:10px;margin-bottom:20px}.test-2{margin-top:10px}.another-test{margin-top:10px;margin-bottom:30px}',
    '.test-1{margin-bottom:20px}.test-1,.test-2,.another-test{margin-top:10px}.another-test{margin-bottom:30px}'
);

test(
    'should perform partial merging of selectors (8)',
    testOutput,
    '.foo{margin:0;display:block}.barim{display:block;line-height:1}.bazaz{font-size:3em;margin:0}',
    '.foo{margin:0}.foo,.barim{display:block}.barim{line-height:1}.bazaz{font-size:3em;margin:0}'
);

test(
    'should not merge over-eagerly (cssnano#36 [case 3])',
    testOutput,
    '.foobam{font-family:serif;display:block}.barim{display:block;line-height:1}.bazaz{font-size:3em;font-family:serif}'
);

test(
    'should not merge over-eagerly (cssnano#36 [case 4])',
    testOutput,
    '.foo{font-family:serif;display:block}.barim{display:block;line-height:1}.bazaz{font-size:3em;font-family:serif}',
    '.foo{font-family:serif}.foo,.barim{display:block}.barim{line-height:1}.bazaz{font-size:3em;font-family:serif}'
);

test(
    'should merge multiple values (cssnano#49)',
    testOutput,
    'h1{border:1px solid red;background-color:red;background-position:50% 100%}h1{border:1px solid red;background-color:red}h1{border:1px solid red}',
    'h1{border:1px solid red;background-color:red;background-position:50% 100%}'
);

test(
    'should perform partial merging of selectors in the opposite direction',
    testOutput,
    'h1{color:black}h2{color:black;font-weight:bold}h3{color:black;font-weight:bold}',
    'h1{color:black}h2,h3{color:black;font-weight:bold}'
);

test(
    'should not perform partial merging of selectors if the output would be longer',
    testOutput,
    '.test0{color:red;border:none;margin:0}.longlonglonglong{color:green;border:none;margin:0}'
);

test(
    'should merge vendor prefixed selectors when vendors are the same',
    testOutput,
    'code ::-moz-selection{background:red}code::-moz-selection{background:red}',
    'code ::-moz-selection,code::-moz-selection{background:red}'
);

test(
    'should not merge mixed vendor prefixes',
    testOutput,
    'code ::-webkit-selection{background:red}code::-moz-selection{background:red}'
);

test(
    'should not merge mixed vendor prefixes (2)',
    testOutput,
    'input[type=range] { -webkit-appearance: none !important; } input[type=range]::-webkit-slider-runnable-track { height: 2px; width: 100px; background: red; border: none; } input[type=range]::-webkit-slider-thumb { -webkit-appearance: none !important; border: none; width: 10px; height: 10px; background: red; } input[type=range]::-moz-range-thumb { border: none; width: 10px; height: 10px; background: red; }'
);

test(
    'should not merge mixed vendor prefixed and non-vendor prefixed',
    testOutput,
    'code ::selection{background:red}code ::-moz-selection{background:red}'
);

test(
    'should not merge single-colon and double-colon syntax for pseudo-elements',
    testOutput,
    'code :-ms-input-placeholder{color:red}code ::-ms-input-placeholder{color:red}'
);

test(
    'should merge text-* properties',
    testOutput,
    'h1{color:red;text-align:right;text-decoration:underline}h2{text-align:right;text-decoration:underline}',
    'h1{color:red}h1,h2{text-align:right;text-decoration:underline}'
);

test(
    'should merge text-* properties (2)',
    testOutput,
    'h1{color:red;text-align:right;text-decoration:underline}h2{text-align:right;text-decoration:underline;color:green}',
    'h1{color:red}h1,h2{text-align:right;text-decoration:underline}h2{color:green}'
);

test(
    'should merge text-* properties (3)',
    testOutput,
    'h1{background:white;color:red;text-align:right;text-decoration:underline}h2{text-align:right;text-decoration:underline;color:red}',
    'h1{background:white}h1,h2{color:red;text-align:right;text-decoration:underline}'
);

test(
    'should merge text-* properties (4)',
    testOutput,
    'h1{color:red;text-align:center;text-transform:small-caps}h2{text-align:center;color:red}',
    'h1{text-transform:small-caps}h1,h2{color:red;text-align:center}'
);

test(
    'should merge text-* properties (5)',
    testOutput,
    'h1{text-align:left;text-transform:small-caps}h2{text-align:right;text-transform:small-caps}',
    'h1{text-align:left}h1,h2{text-transform:small-caps}h2{text-align:right}'
);

test(
    'should not incorrectly extract transform properties',
    testOutput,
    '@keyframes a {0%{transform-origin:right bottom;transform:rotate(-90deg);opacity:0}100%{transform-origin:right bottom;transform:rotate(0);opacity:1}}'
);

test(
    'should not incorrectly extract background properties',
    testOutput,
    '.iPhone{background:url(a.png);background-image:url(../../../sprites/c.png);background-repeat:no-repeat;background-position:-102px -74px}.logo{background:url(b.png);background-image:url(../../../sprites/c.png);background-repeat:no-repeat;background-position:-2px -146px}'
);

test(
    'should not incorrectly extract margin properties',
    testOutput,
    'h2{margin-bottom:20px}h1{margin:10px;margin-bottom:20px}'
);

test(
    'should not incorrectly extract margin properties (2)',
    testOutput,
    'h2{color:red;margin-bottom:20px}h1{color:red;margin:10px;margin-bottom:20px}',
    'h2{margin-bottom:20px}h2,h1{color:red}h1{margin:10px;margin-bottom:20px}'
);

test(
    'should not incorrectly extract margin properties (3)',
    testOutput,
    'h2{margin:0;margin-bottom:20px}h1{margin:0;margin-top:20px}'
);

test(
    'should not incorrectly extract margin properties (4)',
    testOutput,
    'h2{margin:0}h1{margin-top:20px;margin:0}'
);

test(
    'should not incorrectly extract display properties',
    testOutput,
    '.box1{display:inline-block;display:block}.box2{display:inline-block}'
);

test(
    'should handle selector hacks',
    testOutput,
    '.classA{*zoom:1}.classB{box-sizing:border-box;position:relative;min-height:100%}.classC{box-sizing:border-box;position:relative}.classD{box-sizing:border-box;position:relative}',
    '.classA{*zoom:1}.classB{min-height:100%}.classB,.classC,.classD{box-sizing:border-box;position:relative}'
);

test(
    'should handle empty rulesets',
    testOutput,
    'h1{h2{}h3{}}',
    'h1{h2,h3{}}'
);

test(
    'should not throw on charset declarations',
    testOutput,
    '@charset "utf-8";@charset "utf-8";@charset "utf-8";h1{}h2{}',
    '@charset "utf-8";@charset "utf-8";@charset "utf-8";h1,h2{}'
);

test(
    'should not throw on comment nodes',
    testOutput,
    '.navbar-soft .navbar-nav > .active > a{color:#fff;background-color:#303030}.navbar-soft .navbar-nav > .open > a{color:#fff;background-color:rgba(48,48,48,0.8)}/* caret */.navbar-soft .navbar-nav > .dropdown > a .caret{border-top-color:#777;border-bottom-color:#777}'
);

test(
    'should not throw on comment nodes (2)',
    testOutput,
    'h1{color:black;background:blue/*test*/}h2{background:blue}',
    'h1{color:black/*test*/}h1,h2{background:blue}'
);

test(
    'should not be responsible for deduping declarations when merging',
    testOutput,
    'h1{display:block;display:block}h2{display:block;display:block}',
    'h1,h2{display:block;display:block}'
);

test(
    'should not be responsible for deduping selectors when merging',
    testOutput,
    'h1,h2{display:block}h2,h1{display:block}',
    'h1,h2,h2,h1{display:block}'
);

test(
    'should not merge across font face rules',
    testOutput,
    '.one, .two, .three { font-family: "lorem"; font-weight: normal; } .four { font-family: "lorem", serif; font-weight: normal; }.five { font-family: "lorem"; font-weight: normal; } @font-face { font-family: "lorem"; font-weight: normal; src: url(/assets/lorem.eot); src: url(/assets/lorem.eot?#iefix) format("embedded-opentype"), url(/assets/lorem.woff) format("woff"), url(/assets/lorem.ttf) format("truetype"); }',
    '.one, .two, .three { font-family: "lorem"; font-weight: normal; } .four { font-family: "lorem", serif; }.four,.five { font-weight: normal; }.five { font-family: "lorem"; } @font-face { font-family: "lorem"; font-weight: normal; src: url(/assets/lorem.eot); src: url(/assets/lorem.eot?#iefix) format("embedded-opentype"), url(/assets/lorem.woff) format("woff"), url(/assets/lorem.ttf) format("truetype"); }'
);

test(
    'should not merge across font face rules (2)',
    testOutput,
    '.foo { font-weight: normal; } .bar { font-family: "my-font"; font-weight: normal; } @font-face { font-family: "my-font"; font-weight: normal; src: url("my-font.ttf"); }',
    '.foo,.bar { font-weight: normal; } .bar { font-family: "my-font"; } @font-face { font-family: "my-font"; font-weight: normal; src: url("my-font.ttf"); }'
);

test(
    'should not merge conflicting rules',
    testOutput,
    '.a{font-family:Arial;font-family:Helvetica;}.b{font-family:Arial;}'
);

test(
    'should merge properties with vendor prefixes',
    testOutput,
    '.a{-webkit-transform: translateX(-50%) translateY(-50%) rotate(-90deg);-webkit-overflow-scrolling: touch}.b{-webkit-transform: translateX(-50%) translateY(-50%) rotate(-90deg);}',
    '.a{-webkit-overflow-scrolling: touch}.a,.b{-webkit-transform: translateX(-50%) translateY(-50%) rotate(-90deg);}'
);

test(
    'should respect property order and do nothing',
    testOutput,
    'body { overflow: hidden; overflow-y: scroll; overflow-x: hidden;} main { overflow: hidden }'
);

test(
    'should respect property order and do nothing (2)',
    testOutput,
    '.a{ border-color:transparent; border-bottom-color:#111111; border-bottom-style:solid; }.b{ border-color:transparent; border-bottom-color:#222222; border-bottom-style:solid; }'
);

test(
    'should respect property order and do nothing (3)',
    testOutput,
    '.fb-col-md-6 { color: red; border-color:blue; flex: 0 0 auto; flex-basis: 50%; } .fb-col-md-7 { color: red; border-color:blue; flex: 0 0 auto; flex-basis: 58.3%; }',
    '.fb-col-md-6 { flex: 0 0 auto; flex-basis: 50%; } .fb-col-md-6,.fb-col-md-7 { color: red; border-color:blue; } .fb-col-md-7 { flex: 0 0 auto; flex-basis: 58.3%; }'
);

test(
    'should respect property order and do nothing (4) (cssnano#160)',
    testOutput,
    'one { border: 1px solid black; border-top: none; } two { border: 1px solid black; }'
);

test(
    'should respect property order and do nothing (5) (cssnano#87)',
    testOutput,
    '.dispendium-theme.fr-toolbar.fr-top { border-radius: 0; background-clip: padding-box; box-shadow: none; border: 1px solid #E0E0E0; border-bottom: 0; } .dispendium-theme.fr-toolbar.fr-bottom { border-radius: 0; background-clip: padding-box; box-shadow: none; border: 1px solid #E0E0E0; border-top: 0; }'
);

test(
    'should respect property order and do nothing (6) (issue #19)',
    testOutput,
    '.share .comment-count:before { content: \' \'; position: absolute; width: 0; height: 0; right: 7px; top: 26px; border: 5px solid; border-color: #326891 #326891 transparent transparent; } .share .comment-count:after { content: \' \'; position: absolute; width: 0; height: 0; right: 8px; top: 24px; border: 5px solid; border-color: #fff #fff transparent transparent; }'
);

test(
    'should not merge @keyframes rules',
    testOutput,
    '@keyframes foo{0%{visibility:visible;transform:scale3d(.85,.85,.85);opacity:0}to{visibility:visible;opacity:1}}'
);

test(
    'should not merge overlapping rules with vendor prefixes',
    testOutput,
    '.foo{background:#fff;-webkit-background-clip:text}.bar{background:#000;-webkit-background-clip:text}'
);

test(
    'should not destroy any declarations when merging',
    testOutput,
    '.a{background-color:#fff}.a{background-color:#717F83;color:#fff}',
    '.a{background-color:#fff;background-color:#717F83;color:#fff}',
);

test(
    'should merge ::placeholder selectors when supported',
    testOutput,
    '::placeholder{color:blue}h1{color:blue}',
    '::placeholder,h1{color:blue}',
    {env: 'chrome58'}
);

test(
    'should not merge general sibling combinators',
    testOutput,
    'div{color:#fff}a ~ b{color:#fff}',
    'div{color:#fff}a ~ b{color:#fff}',
    {env: 'ie6'}
);

test(
    'should not merge child combinators',
    testOutput,
    'div{color:#fff}a > b{color:#fff}',
    'div{color:#fff}a > b{color:#fff}',
    {env: 'ie6'}
);

test(
    'should not merge attribute selectors (css 2.1)',
    testOutput,
    'div{color:#fff}[href]{color:#fff}',
    'div{color:#fff}[href]{color:#fff}',
    {env: 'ie6'}
);

test(
    'should not merge attribute selectors (css 2.1) (2)',
    testOutput,
    'div{color:#fff}[href="foo"]{color:#fff}',
    'div{color:#fff}[href="foo"]{color:#fff}',
    {env: 'ie6'}
);

test(
    'should not merge attribute selectors (css 2.1) (3)',
    testOutput,
    'div{color:#fff}[href~="foo"]{color:#fff}',
    'div{color:#fff}[href~="foo"]{color:#fff}',
    {env: 'ie6'}
);

test(
    'should not merge attribute selectors (css 2.1) (4)',
    testOutput,
    'div{color:#fff}[href|="foo"]{color:#fff}',
    'div{color:#fff}[href|="foo"]{color:#fff}',
    {env: 'ie6'}
);

test(
    'should not merge attribute selectors (css 3)',
    testOutput,
    'div{color:#fff}[href^="foo"]{color:#fff}',
    'div{color:#fff}[href^="foo"]{color:#fff}',
    {env: 'ie7'}
);

test(
    'should not merge attribute selectors (css 3) (2)',
    testOutput,
    'div{color:#fff}[href$="foo"]{color:#fff}',
    'div{color:#fff}[href$="foo"]{color:#fff}',
    {env: 'ie7'}
);

test(
    'should not merge attribute selectors (css 3) (3)',
    testOutput,
    'div{color:#fff}[href*="foo"]{color:#fff}',
    'div{color:#fff}[href*="foo"]{color:#fff}',
    {env: 'ie7'}
);

test(
    'should not merge case insensitive attribute selectors',
    testOutput,
    'div{color:#fff}[href="foo" i]{color:#fff}',
    'div{color:#fff}[href="foo" i]{color:#fff}',
    {env: 'edge15'}
);

const pseudoKeys = Object.keys(pseudoElements);

test(`should not merge ${pseudoKeys.length} pseudo elements`, t => {
    return Promise.all(
        pseudoKeys.reduce((promises, pseudo) => {
            return [...promises, testOutput(
                t,
                `${pseudo}{color:blue}h1{color:blue}`,
                `${pseudo}{color:blue}h1{color:blue}`,
                {env: 'ie6'}
            )];
        }, [])
    );
});

test(
    'should handle css mixins',
    testOutput,
    `paper-card{--paper-card-content:{padding-top:0};margin:0 auto 16px;width:768px;max-width:calc(100% - 32px)}`,
    `paper-card{--paper-card-content:{padding-top:0};margin:0 auto 16px;width:768px;max-width:calc(100% - 32px)}`
);

test('should use the postcss plugin api', t => {
    t.truthy(plugin().postcssVersion, 'should be able to access version');
    t.deepEqual(plugin().postcssPlugin, name, 'should be able to access name');
});

test('should not crash when node.raws.value is null', t => {
    const css = '$color: red; h1{box-shadow:inset 0 -10px 12px 0 $color, /* some comment */ inset 0 0 5px 0 $color;color:blue}h2{color:blue}';
    const res = postcss([ vars(), comments(), plugin]).process(css).css;

    t.deepEqual(res, 'h1{box-shadow:inset 0 -10px 12px 0 red, inset 0 0 5px 0 red}h1,h2{color:blue}');
});

test('should not crash when node.raws.value is null (2)', t => {
    const css = '#foo .bar { margin-left: auto ; margin-right: auto ; } #foo .qux { margin-right: auto ; }';
    const res = postcss([ comments(), plugin]).process(css).css;

    t.deepEqual(res, '#foo .bar{ margin-left:auto; } #foo .bar,#foo .qux{ margin-right:auto; }');
});
