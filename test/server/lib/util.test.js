import * as test from 'node:test';
import {strict as assert} from 'node:assert';
import  * as util from "../../../server/lib/util.js";

/**
 * Tests for server/lib/util.js
 *
 * This is mostly a regression suite, to make sure behavior
 * is preserved throughout changes to the server infrastructure.
 */

test.describe('util.js', () => {
    test.describe('massToRadius', () => {
        test.it('should return non-zero radius on zero input', () => {
        let r = util.massToRadius(0);
        assert.equal(typeof(r),'number');
        assert.equal(r,4);
        });

        test.it('should convert masses to a circle radius', () => {
            let r1 = util.massToRadius(4),
                r2 = util.massToRadius(16),
                r3 = util.massToRadius(1);
            assert.equal(r1,16);
            assert.equal(r2,28);
            assert.equal(r3,10);
        });
    });

    test.describe('validNick', () => {
        test.it.skip('should allow empty player nicknames', () => {
        let bool = util.validNick('');
        assert.equal(bool,true);
        });

        test.it('should allow ascii character nicknames', () => {
            let n1 = util.validNick('Walter_White'),
                n2 = util.validNick('Jesse_Pinkman'),
                n3 = util.validNick('hank'),
                n4 = util.validNick('marie_schrader12'),
                n5 = util.validNick('p');

            assert.equal(n1,true);
            assert.equal(n2,true);
            assert.equal(n3,true);
            assert.equal(n4,true);
            assert.equal(n5,true);
        });

        test.it('should disallow unicode-dependent alphabets', () => {
            let n1 = util.validNick('Йèæü');

            assert.equal(n1,false);
        });

        test.it('should disallow spaces in nicknames', () => {
            let n1 = util.validNick('Walter White');
            
            assert.equal(n1,false);
        });
    });

    test.describe('log', () => {
        test.it('should compute the log_{base} of a number', () => {
        const base10 = util.mathLog(1, 10);
        const base2  = util.mathLog(1, 2);
        const identity = util.mathLog(10, 10);
        const logNineThree = Math.round(util.mathLog(9,3) * 1e5) / 1e5; // Tolerate rounding errors

        // log(1) should equal 0, no matter the base
        assert.equal(base10, base2);

        // log(n,n) === 1
        assert.equal(identity, 1);

        // perform a trivial log calculation: 3^2 === 9
        assert.equal(logNineThree, 2);
        });

    });

    test.describe('getDistance', () => {
        const Point = (x, y, r) => {
        return {
            x,
            y,
            radius: r
        };
        }

        const p1 = Point(-100, 20, 1);
        const p2 = Point(0, 40, 5);

        test.it('should return a positive number', () => {
        let distance = util.getDistance(p1, p2);
        assert.equal(distance >= 0, true);
        });
    });
});
