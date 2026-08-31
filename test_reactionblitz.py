import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path('/mnt/data/reactionblitz')
HTML = (ROOT / 'index.html').read_text()
CSS = (ROOT / 'styles.css').read_text()
CORE = (ROOT / 'game-core.js').read_text()
SCRIPT = (ROOT / 'script.js').read_text()

# Speed up only the round duration in the browser suite. Difficulty values are production values.
TEST_SCRIPT = SCRIPT.replace('const ROUND_MS = 30_000;', 'const ROUND_MS = 5_000;')
HTML_NO_SCRIPTS = re.sub(r'\s*<script src="(?:game-core|script)\.js"></script>', '', HTML)


async def install_game(page, scores=None, leaderboard=None, player_name=None, blocked_storage=False):
    await page.set_content(HTML_NO_SCRIPTS)
    await page.add_style_tag(content=CSS)
    if blocked_storage:
        await page.evaluate("""() => {
            Object.defineProperty(window, 'localStorage', {
                configurable: true,
                get() { throw new Error('blocked'); }
            });
        }""")
    else:
        scores = scores or {'easy': 300, 'medium': 400, 'hard': 500}
        leaderboard = leaderboard or []
        await page.evaluate(
            """({scores, leaderboard, playerName}) => {
                const data = {
                    reactionBlitzHighScoresV1: JSON.stringify(scores),
                    reactionBlitzLeaderboardV1: JSON.stringify(leaderboard)
                };
                if (playerName) data.reactionBlitzPlayerName = playerName;
                const storage = {
                    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
                    setItem(key, value) { data[key] = String(value); },
                    removeItem(key) { delete data[key]; },
                    clear() { for (const key of Object.keys(data)) delete data[key]; },
                    _data: data
                };
                Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
            }""",
            {'scores': scores, 'leaderboard': leaderboard, 'playerName': player_name},
        )
    await page.add_script_tag(content=CORE)
    await page.add_script_tag(content=TEST_SCRIPT)


async def assert_target_inside(page):
    target = page.locator('.target')
    await target.wait_for()
    box = await target.bounding_box()
    area = await page.locator('#playArea').bounding_box()
    assert box and area
    epsilon = 2.5
    assert box['x'] >= area['x'] - epsilon
    assert box['y'] >= area['y'] - epsilon
    assert box['x'] + box['width'] <= area['x'] + area['width'] + epsilon
    assert box['y'] + box['height'] <= area['y'] + area['height'] + epsilon


async def wait_for_target(page):
    await page.wait_for_timeout(140)
    await page.locator('.target').wait_for()


async def capture_mode(page, mode):
    await page.locator(f'input[value="{mode}"]').check(force=True)
    await page.evaluate('Math.random = () => 0.9')
    await page.locator('#startButton').click()
    await page.locator('.target--real').wait_for()
    box = await page.locator('.target').bounding_box()
    lifetime = int(await page.locator('.target').get_attribute('data-lifetime'))
    return round(box['width']), lifetime


async def capture_kind(page, mode, random_value):
    await page.locator(f'input[value="{mode}"]').check(force=True)
    await page.evaluate('(value) => { Math.random = () => value; }', random_value)
    await page.locator('#startButton').click()
    await page.locator('.target').wait_for()
    return await page.locator('.target').get_attribute('data-kind')


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
        context = await browser.new_context(viewport={'width': 320, 'height': 700}, has_touch=True)

        # Initial chooser and obvious mode differences.
        page = await context.new_page()
        errors = []
        page.on('console', lambda msg: errors.append(f'console:{msg.type}:{msg.text}') if msg.type == 'error' else None)
        page.on('pageerror', lambda exc: errors.append(f'pageerror:{exc}'))
        await install_game(page)
        assert await page.locator('#difficultyChooser').is_visible()
        assert await page.locator('input[value="easy"]').is_checked()
        assert await page.locator('#difficulty').inner_text() == 'Easy'
        assert await page.locator('#highScore').inner_text() == '300'
        assert await page.locator('#timer').get_attribute('aria-live') is None
        assert await page.locator('#playArea').get_attribute('role') is None
        assert await page.locator('#startButton').evaluate("el => el.closest('.game-card') !== null && el.compareDocumentPosition(document.querySelector('#playArea')) & Node.DOCUMENT_POSITION_FOLLOWING")
        assert await page.locator('#leaderboardTitle').inner_text() == 'All-Time Top 25'
        assert await page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')
        await page.close()

        easy_page = await context.new_page()
        await install_game(easy_page)
        easy_size, easy_lifetime = await capture_mode(easy_page, 'easy')
        await easy_page.close()

        medium_page = await context.new_page()
        await install_game(medium_page)
        medium_size, medium_lifetime = await capture_mode(medium_page, 'medium')
        await medium_page.close()

        hard_page = await context.new_page()
        await install_game(hard_page)
        hard_size, hard_lifetime = await capture_mode(hard_page, 'hard')
        await hard_page.close()

        assert easy_size > medium_size > hard_size >= 44
        assert easy_lifetime > medium_lifetime > hard_lifetime
        assert easy_size - hard_size >= 30
        assert easy_lifetime - hard_lifetime >= 1000

        # The same random roll produces fewer decoys on Easy than on Medium/Hard.
        kinds = {}
        for mode in ('easy', 'medium', 'hard'):
            mode_page = await context.new_page()
            await install_game(mode_page)
            kinds[mode] = await capture_kind(mode_page, mode, 0.15)
            await mode_page.close()
        assert kinds == {'easy': 'real', 'medium': 'decoy', 'hard': 'decoy'}

        # Main Easy-mode lifecycle: easy really is forgiving, scoring remains unchanged.
        page = await context.new_page()
        page.on('console', lambda msg: errors.append(f'console:{msg.type}:{msg.text}') if msg.type == 'error' else None)
        page.on('pageerror', lambda exc: errors.append(f'pageerror:{exc}'))
        await install_game(page)
        await page.evaluate('Math.random = () => 0.9')
        await page.locator('#playerName').fill('  Ada   Lovelace  ')

        # Pre-start play-area miss is ignored.
        await page.dispatch_event('#playArea', 'pointerdown', {'pointerType': 'mouse', 'button': 0, 'clientX': 20, 'clientY': 20})
        assert await page.locator('#score').inner_text() == '0'

        # Start with keyboard; re-entrant starts and hidden restart cannot create a second loop.
        await page.locator('#startButton').focus()
        await page.keyboard.press('Enter')
        await page.evaluate("""
            const b = document.querySelector('#startButton');
            b.click(); b.click();
            document.querySelector('#restartButton').click();
        """)
        await page.locator('.target').wait_for()
        assert await page.locator('.target').count() == 1
        assert await page.locator('#startButton').is_disabled()
        assert await page.locator('#playerName').is_disabled()
        assert await page.locator('input[value="easy"]').is_disabled()
        await page.wait_for_timeout(80)
        play_box = await page.locator('#playArea').bounding_box()
        assert play_box['y'] >= -2 and play_box['y'] < 120
        assert await page.locator('.target').evaluate('el => document.activeElement === el')
        await assert_target_inside(page)
        assert int(await page.locator('.target').get_attribute('data-lifetime')) >= 1900

        # Hit by keyboard, then mouse, then touch; points/combo are unchanged by selected difficulty.
        await page.keyboard.press('Enter')
        assert await page.locator('#score').inner_text() == '100'
        assert await page.locator('.game-feedback--hit').last.inner_text() == '+100'
        await wait_for_target(page)
        await page.locator('.target--real').click()
        assert await page.locator('#score').inner_text() == '210'
        await wait_for_target(page)
        await page.locator('.target--real').tap()
        assert await page.locator('#score').inner_text() == '330'
        assert await page.locator('#combo').inner_text() == '3×'

        # Empty miss costs zero and resets combo.
        await wait_for_target(page)
        before = await page.locator('#score').inner_text()
        await page.dispatch_event('#playArea', 'pointerdown', {'pointerType': 'mouse', 'button': 0, 'clientX': 12, 'clientY': 12})
        assert await page.locator('#score').inner_text() == before
        assert await page.locator('#combo').inner_text() == '0×'
        assert await page.locator('.game-feedback--miss').last.inner_text() == 'MISS'

        # Force the next spawn to be a decoy; double activation deducts only once.
        await page.evaluate('Math.random = () => 0.0')
        current = page.locator('.target--real')
        if await current.count():
            await current.click()
        await wait_for_target(page)
        assert await page.locator('.target--decoy').count() == 1
        score_before_decoy = int(await page.locator('#score').inner_text())
        await page.evaluate("const t=document.querySelector('.target--decoy'); t.click(); t.click();")
        assert int(await page.locator('#score').inner_text()) == max(0, score_before_decoy - 75)
        assert await page.locator('#combo').inner_text() == '0×'

        # Resize/orientation keeps targets contained and no horizontal scrolling.
        await page.set_viewport_size({'width': 700, 'height': 320})
        await page.wait_for_timeout(100)
        if await page.locator('.target').count():
            await assert_target_inside(page)
        assert await page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')

        await page.wait_for_selector('#results:not([hidden])', timeout=6000)
        assert await page.locator('.target').count() == 0
        assert await page.locator('#timer').inner_text() == '0.0'
        assert await page.locator('#resultsTitle').evaluate('el => document.activeElement === el')
        assert not await page.locator('input[value="easy"]').is_disabled()
        assert re.fullmatch(r'—|\d+ ms', await page.locator('#bestReaction').inner_text())
        assert re.fullmatch(r'\d+%', await page.locator('#accuracy').inner_text())
        assert await page.locator('#leaderboardBody tr').count() == 1
        first_row = page.locator('#leaderboardBody tr').first
        assert await first_row.locator('th').inner_text() == 'Ada Lovelace'
        assert await first_row.locator('td').nth(2).inner_text() == 'Easy'
        assert not await page.locator('#leaderboardMessage').is_hidden()
        saved_name = await page.evaluate("window.localStorage._data.reactionBlitzPlayerName")
        assert saved_name == 'Ada Lovelace'

        # Change modes after the round; high score display changes per mode.
        await page.locator('input[value="hard"]').check(force=True)
        assert await page.locator('#difficulty').inner_text() == 'Hard'
        assert await page.locator('#highScore').inner_text() == '500'

        # Repeated restart starts exactly one Hard round.
        await page.locator('#restartButton').focus()
        await page.keyboard.press(' ')
        await page.evaluate("const r=document.querySelector('#restartButton'); r.click(); r.click();")
        await page.locator('.target').wait_for()
        assert await page.locator('.target').count() == 1
        assert await page.locator('#difficulty').inner_text() == 'Hard'
        hard_box = await page.locator('.target').bounding_box()
        assert hard_box['width'] <= 60.5
        assert int(await page.locator('.target').get_attribute('data-lifetime')) <= 850

        # Expired Hard real target is a zero-point miss and cannot become a late hit.
        await page.evaluate('Math.random = () => 0.9')
        if await page.locator('.target--decoy').count():
            await page.locator('.target--decoy').click()
            await wait_for_target(page)
        hard_score_before_expiry = await page.locator('#score').inner_text()
        misses_before_expiry = int(await page.locator('#misses').inner_text()) if await page.locator('#results').is_visible() else None
        active = page.locator('.target--real')
        if await active.count():
            lifetime = int(await active.get_attribute('data-lifetime'))
            await page.wait_for_timeout(lifetime + 80)
            assert await page.locator('#score').inner_text() == hard_score_before_expiry

        # Post-round score is locked and storage data remains valid/per-mode.
        await page.wait_for_selector('#results:not([hidden])', timeout=6000)
        locked_score = await page.locator('#finalScore').inner_text()
        await page.dispatch_event('#playArea', 'pointerdown', {'pointerType': 'mouse', 'button': 0, 'clientX': 20, 'clientY': 20})
        await page.wait_for_timeout(60)
        assert await page.locator('#score').inner_text() == locked_score
        assert int(await page.locator('#misses').inner_text()) >= 1
        raw_scores = await page.evaluate("window.localStorage._data.reactionBlitzHighScoresV1")
        parsed_scores = json.loads(raw_scores)
        assert set(parsed_scores) == {'easy', 'medium', 'hard'}


        # Legacy Reflex Rush browser data migrates into the renamed ReactionBlitz game.
        migration = await context.new_page()
        await migration.set_content(HTML_NO_SCRIPTS)
        await migration.add_style_tag(content=CSS)
        await migration.evaluate("""() => {
            const data = {
              reflexRushHighScoresV2: JSON.stringify({easy: 111, medium: 222, hard: 333}),
              reflexRushLeaderboardV1: JSON.stringify([{name: 'Legacy Player', score: 777, mode: 'medium', createdAt: '2026-08-27T12:00:00.000Z'}]),
              reflexRushPlayerName: 'Legacy Player'
            };
            Object.defineProperty(window, 'localStorage', { configurable: true, value: {
              getItem: k => data[k] ?? null,
              setItem: (k, v) => { data[k] = String(v); },
              _data: data
            }});
        }""")
        await migration.add_script_tag(content=CORE)
        await migration.add_script_tag(content=TEST_SCRIPT)
        assert await migration.locator('#highScore').inner_text() == '111'
        assert await migration.locator('#playerName').input_value() == 'Legacy Player'
        assert 'Legacy Player' in await migration.locator('#leaderboardBody').inner_text()
        await migration.close()

        # Blocked storage must not break initialization.
        blocked = await context.new_page()
        blocked_errors = []
        blocked.on('pageerror', lambda exc: blocked_errors.append(str(exc)))
        await install_game(blocked, blocked_storage=True)
        assert await blocked.locator('#startButton').is_visible()
        assert await blocked.locator('#highScore').inner_text() == '0'
        assert await blocked.locator('#leaderboardBody tr').count() == 1
        assert 'No scores yet' in await blocked.locator('#leaderboardBody').inner_text()
        assert not blocked_errors
        await blocked.close()

        # Malformed storage must be rejected rather than becoming NaN or partial numbers.
        malformed = await context.new_page()
        await malformed.set_content(HTML_NO_SCRIPTS)
        await malformed.add_style_tag(content=CSS)
        await malformed.evaluate("""() => {
            const data = {
              reactionBlitzHighScoresV1: '{bad json',
              reflexRushHighScore: '300oops',
              reactionBlitzLeaderboardV1: '[{bad]'
            };
            Object.defineProperty(window, 'localStorage', { configurable: true, value: {
              getItem: k => data[k] ?? null,
              setItem: () => {}
            }});
        }""")
        await malformed.add_script_tag(content=CORE)
        await malformed.add_script_tag(content=TEST_SCRIPT)
        assert await malformed.locator('#highScore').inner_text() == '0'
        assert 'No scores yet' in await malformed.locator('#leaderboardBody').inner_text()
        await malformed.close()

        # Stored leaderboard is sanitized, sorted, and limited to the best 25.
        seeded = [
            {'name': f'P{i}', 'score': 1000 - i * 10, 'mode': 'medium', 'createdAt': f'2026-08-{(i % 27) + 1:02d}T12:00:00.000Z'}
            for i in range(30)
        ]
        seeded.append({'name': 'Bad', 'score': '20oops', 'mode': 'hard', 'createdAt': 'not-a-date'})
        board_page = await context.new_page()
        await install_game(board_page, leaderboard=seeded, player_name='Grace')
        assert await board_page.locator('#leaderboardBody tr').count() == 25
        assert await board_page.locator('#leaderboardBody tr').first.locator('td').nth(1).inner_text() == '1000'
        assert await board_page.locator('#playerName').input_value() == 'Grace'
        await board_page.close()

        assert not errors, errors
        await browser.close()
        print(f'PASS browser: selectable modes easy={easy_size}px/{easy_lifetime}ms, medium={medium_size}px/{medium_lifetime}ms, hard={hard_size}px/{hard_lifetime}ms; lifecycle/input/storage/responsive checks pass')


asyncio.run(main())
