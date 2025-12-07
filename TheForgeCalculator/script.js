const ENTRY_SIZE = 100; // pixels
const ITEMS = {
    "Stone": 0.2,
    "Sand Stone": 0.25,
    "Copper": 0.3,
    "Iron": 0.35,
    "Tin": 0.425,
    "Silver": 0.5,
    "Gold": 0.425,
    "Mushroomite": 0.8,
    "Platinum": 0.8,
    "Bananite": 0.85,
    "Cardboardite": 0.7,
    "Aite": 1,
    "Poopite": 1.2,
    "Fichillium": 0,
    "Cobalt": 1,
    "Titanium": 1.15,
    "Lapis Lazuli": 1.3,
    "Volcanic Rock": 1.55,
    "Quartz": 1.5,
    "Amethyst": 1.65,
    "Topaz": 1.75,
    "Diamond": 2,
    "Sapphire": 2.25,
    "Cuprite": 2.43,
    "Obsidian": 2.35,
    "Emerald": 2.55,
    "Ruby": 2.95,
    "Rivalite": 3.33,
    "Uranium": 3,
    "Mythril": 3.5,
    "Eye Ore": 4,
    "Fireite": 4.5,
    "Magmaite": 5,
    "Lightite": 4.6,
    "Demonite": 5.5,
    "Darkryte": 6.3,
    "Magenta Crystal Ore": 3.1,
    "Crimson Crystal Ore": 3.3,
    "Green Crystal Ore": 3.2,
    "Orange Crystal Ore": 3,
    "Blue Crystal Ore": 3.4,
    "Arcane Crystal Ore": 5.25,
    "Rainbow Crystal Ore": 7.5,
    "Galaxite": 11.5,
    "Boneite": 1.2,
    "Dark Boneite": 2.25,
    "Slimeite": 2.25
};

/* =============================
   DOM references
   ============================= */
const itemsGrid = document.getElementById('itemsGrid');
const calculateBtn = document.getElementById('calculateBtn');
const desiredInput = document.getElementById('desiredInput');
const totalResultsInput = document.getElementById('totalResultsInput');
const progressBar = document.getElementById('progressBar');
const resultsContainer = document.getElementById('resultsContainer');
const statusLine = document.getElementById('statusLine');

/* =============================
   Dropdown presets
   ============================= */
const presetOptions = {
    "Dagger/Light Helmet": 3,
    "Straight Sword": 6,
    "Light Leggings": 7,
    "Light Leggings +1": 8,
    "Gauntlet": 9,
    "Light Chestplate": 10,
    "katana": 12,
    "Medium Helmet": 13,
    "Great Sword/Medium Leggings": 16,
    "Medium Leggings +1": 17,
    "Medium Chestplate": 21,
    "Great Axe": 22,
    "Heavy Helmet": 25,
    "Heavy Helmet +1": 26,
    "Heavy Leggings/Colossal Sword (49%)": 30,
    "Colossal Sword (51%)": 9,
    "Heavy Chestplate (47%)": 33,
    "Heavy Chestplate (54%)": 34,
    "Heavy Chestplate (60%)": 35,
    "Colossal Sword (61%)": 36,
    "Heavy Chestplate (71%)": 38,
    "Heavy Chestplate (80%)": 44,
    "Colossal Sword (70%)": 47,
};

(function insertPresetDropdown() {
    const label = document.querySelector('label:has(#desiredInput)');
    const select = document.createElement('select');
    select.style.marginLeft = "8px";

    const defaultOpt = document.createElement('option');
    defaultOpt.textContent = "Options";
    defaultOpt.value = "";
    select.appendChild(defaultOpt);

    for (const [name, val] of Object.entries(presetOptions)) {
        const opt = document.createElement('option');
        opt.textContent = name;
        opt.value = val;
        select.appendChild(opt);
    }

    select.addEventListener('change', () => {
        if (select.value !== "") {
            desiredInput.value = select.value;
        }
    });

    label.after(select);
})();

/* =============================
   Primary Material Tie Option
   ============================= */
let allowTiesCheckbox;
let tieOptionContainer;

(function insertTieToggle() {
    tieOptionContainer = document.createElement("div");
    tieOptionContainer.id = "tieOptionContainer";
    tieOptionContainer.style.display = "none";
    tieOptionContainer.style.marginTop = "6px";

    tieOptionContainer.innerHTML = `
      <label>
        Primary Ties:
        <input type="checkbox" id="allowTies">
      </label>
  `;

    // Insert above calculate button
    const prog = document.getElementById("progressContainer");
    prog.parentNode.insertBefore(tieOptionContainer, prog);

    allowTiesCheckbox = document.getElementById("allowTies");
    allowTiesCheckbox.checked = false;
})();

/* =============================
   Click selection support
   ============================= */
let selectedItemName = null;

function toggleItemSelection(div, name) {
    if (selectedItemName === name) {
        selectedItemName = null;
        div.classList.remove("selected-item");
        tieOptionContainer.style.display = "none";
        allowTiesCheckbox.checked = false;
        return;
    }

    const prev = document.querySelector(".selected-item");
    if (prev) prev.classList.remove("selected-item");

    selectedItemName = name;
    div.classList.add("selected-item");

    // Show tie option when a primary material is selected
    tieOptionContainer.style.display = "block";
}

/* =============================
   Helpers: image cache & draw
   ============================= */

const imageCache = new Map();

function tryLoadImage(name) {
    const base = 'Images/' + name;
    const exts = ['.png', '.jpg', '.jpeg', '.webp'];
    let i = 0;
    return new Promise((resolve) => {
        function tryNext() {
            if (i >= exts.length) {
                resolve(null);
                return;
            }
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                i++;
                tryNext();
            };
            img.src = base + exts[i];
        }
        tryNext();
    });
}

async function makeCanvasFor(name, count = null) {
    const key = `${name}::${count}`;
    if (imageCache.has(key)) return imageCache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = ENTRY_SIZE;
    canvas.height = ENTRY_SIZE;
    const ctx = canvas.getContext('2d');

    const img = await tryLoadImage(name);
    if (img) ctx.drawImage(img, 0, 0, ENTRY_SIZE, ENTRY_SIZE);
    else {
        ctx.fillStyle = '#3c3c3c';
        ctx.fillRect(0, 0, ENTRY_SIZE, ENTRY_SIZE);
    }

    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.strokeText(name, ENTRY_SIZE / 2, ENTRY_SIZE - 2);
    ctx.fillText(name, ENTRY_SIZE / 2, ENTRY_SIZE - 2);

    if (count !== null) {
        ctx.textBaseline = "top";
        ctx.strokeText(String(count), ENTRY_SIZE / 2, 0);
        ctx.fillText(String(count), ENTRY_SIZE / 2, 0);
    }

    imageCache.set(key, canvas);
    return canvas;
}

/* =============================
   Build Items Grid
   ============================= */
function buildItemsGrid() {
    itemsGrid.innerHTML = '';

    for (const [name, value] of Object.entries(ITEMS)) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.dataset.name = name;

        itemDiv.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() === "input") return;
            toggleItemSelection(itemDiv, name);
        });

        const canvas = document.createElement('canvas');
        canvas.width = ENTRY_SIZE;
        canvas.height = ENTRY_SIZE;
        itemDiv.appendChild(canvas);

        (async () => {
            const c = await makeCanvasFor(name);
            canvas.getContext("2d").drawImage(c, 0, 0);
        })();

        const input = document.createElement('input');
        input.type = "number";
        input.value = 0;
        input.min = 0;
        input.className = "item-count";
        itemDiv.appendChild(input);

        itemsGrid.appendChild(itemDiv);
    }
}

/* =============================
   Counting Utilities
   ============================= */
function countCompositions(maxCounts, target) {
    const key = maxCounts.join(',') + '|' + target;
    if (!countCompositions._memo) countCompositions._memo = new Map();
    const memo = countCompositions._memo;
    if (memo.has(key)) return memo.get(key);

    function dp(i, remaining) {
        const k = i + ":" + remaining;
        if (!dp._memo) dp._memo = new Map();
        if (dp._memo.has(k)) return dp._memo.get(k);

        if (i === maxCounts.length)
            return remaining === 0 ? 1 : 0;

        let total = 0;
        const max = Math.min(maxCounts[i], remaining);
        for (let x = 1; x <= max; x++)
            total += dp(i + 1, remaining - x);

        dp._memo.set(k, total);
        return total;
    }

    const result = dp(0, target);
    memo.set(key, result);
    return result;
}

function generateCountsAsync(maxCounts, target, onYield, batchSize = 500) {
    const stack = [{
        idx: 0,
        prefix: [],
        remaining: target
    }];
    let yielded = 0;

    return new Promise(resolve => {
        function step() {
            while (stack.length > 0) {
                const {
                    idx,
                    prefix,
                    remaining
                } = stack.pop();

                if (idx === maxCounts.length) {
                    if (remaining === 0) {
                        onYield(prefix.slice());
                        yielded++;
                        if (yielded % batchSize === 0) {
                            setTimeout(step, 0);
                            return;
                        }
                    }
                    continue;
                }

                const max = Math.min(maxCounts[idx], remaining);
                for (let x = max; x >= 1; x--) {
                    stack.push({
                        idx: idx + 1,
                        prefix: prefix.concat(x),
                        remaining: remaining - x
                    });
                }
            }
            resolve();
        }
        step();
    });
}

/* =============================
   Main calculation
   ============================= */

async function calculate() {
    resultsContainer.innerHTML = '';
    statusLine.textContent = '';
    imageCache.clear();

    const desired = parseInt(desiredInput.value) || 1;
    const maxDisplay = parseInt(totalResultsInput.value) || 50;

    const active = [];
    for (const div of [...itemsGrid.children]) {
        const count = parseInt(div.querySelector("input").value) || 0;
        if (count > 0) {
            active.push({
                name: div.dataset.name,
                value: ITEMS[div.dataset.name],
                max: count
            });
        }
    }

    if (active.length === 0) {
        alert("Set at least one item count > 0");
        return;
    }

    function combinations(arr, r) {
        const out = [];

        function rec(start, combo) {
            if (combo.length === r) return out.push(combo.slice());
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                rec(i + 1, combo);
                combo.pop();
            }
        }
        rec(0, []);
        return out;
    }

    const combos = [];
    for (let r = 1; r <= Math.min(4, active.length); r++)
        combos.push(...combinations(active, r));

    let totalWork = 0;
    const comboCounts = [];
    for (const combo of combos) {
        const maxCounts = combo.map(x => x.max);
        const c = countCompositions(maxCounts, desired);
        comboCounts.push(c);
        totalWork += c;
    }

    progressBar.max = totalWork;
    progressBar.value = 0;

    if (totalWork === 0) {
        statusLine.textContent = "No valid combinations.";
        return;
    }

    const results = [];
    let done = 0;

    const requiredName = selectedItemName;
    const allowTies = requiredName ? allowTiesCheckbox.checked : false;

    /* ----------------------------
       Generate all valid results
       ---------------------------- */
    for (let ci = 0; ci < combos.length; ci++) {
        const combo = combos[ci];
        const maxCounts = combo.map(x => x.max);

        await generateCountsAsync(maxCounts, desired, counts => {
            done++; // ALWAYS increment progress, even if rejected
            if (done % 10 === 0) {
                progressBar.value = done;
                statusLine.textContent = `Progress: ${done}/${totalWork}`;
            }

            // If no required item, accept immediately
            if (!requiredName) {
                accept();
                return;
            }

            const requiredIndex = combo.findIndex(c => c.name === requiredName);
            if (requiredIndex === -1) return; // reject: item not in combo

            const reqCount = counts[requiredIndex];
            const maxCount = Math.max(...counts);

            if (!allowTies) {
                // must be strictly the largest AND no ties
                if (reqCount !== maxCount) return;
                if (counts.filter(c => c === maxCount).length > 1) return;
            } else {
                // ties allowed, must be at least tied for max
                if (reqCount < maxCount) return;
            }

            accept();

            function accept() {
                let totalVal = 0;
                for (let i = 0; i < counts.length; i++)
                    totalVal += combo[i].value * counts[i];

                results.push({
                    avg: totalVal / desired,
                    combo,
                    counts
                });
            }
        });

        await new Promise(r => setTimeout(r, 0));
    }

    /* ----------------------------
       Sort results
       ---------------------------- */
    progressBar.value = totalWork;
    statusLine.textContent = `Sorting ${results.length} results...`;

    results.sort((a, b) => b.avg - a.avg);
    const display = results.slice(0, maxDisplay);

    if (results.length > display.length) {
        const msg = document.createElement("div");
        msg.style.color = "red";
        msg.textContent = `Showing top ${display.length} of ${results.length} results.`;
        resultsContainer.appendChild(msg);
    }

    /* ----------------------------
       Render results
       ---------------------------- */
    for (const r of display) {
        const row = document.createElement("div");
        row.className = "result-row";

        const itemsFrame = document.createElement("div");
        itemsFrame.className = "result-items";

        for (let i = 0; i < 4; i++) {
            const slot = document.createElement("div");
            slot.className = "result-slot";

            if (i < r.combo.length) {
                const canvas = document.createElement("canvas");
                canvas.width = ENTRY_SIZE;
                canvas.height = ENTRY_SIZE;
                (async () => {
                    const c = await makeCanvasFor(r.combo[i].name, r.counts[i]);
                    canvas.getContext("2d").drawImage(c, 0, 0);
                })();
                slot.appendChild(canvas);
            }
            itemsFrame.appendChild(slot);
        }

        const mult = document.createElement("div");
        mult.className = "result-mult";
        mult.textContent = r.avg.toFixed(3);

        row.appendChild(itemsFrame);
        row.appendChild(mult);
        resultsContainer.appendChild(row);

        await new Promise(r => setTimeout(r, 0));
    }

    statusLine.textContent = `Done — displayed ${display.length} results.`;
}

/* =============================
   Initialize
   ============================= */

buildItemsGrid();
calculateBtn.addEventListener("click", () => {
    calculateBtn.disabled = true;
    (async () => {
        await calculate();
        calculateBtn.disabled = false;
    })();
});