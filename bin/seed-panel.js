/* seed-panel.js */
QingheModules.define("./seed-panel.js", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSeedPanel = createSeedPanel;
const seeding_js_1 = require("./seeding.js");
const $ = id => document.getElementById(id);
const names = { ready: '待命中', outbound: '飞往空田', sowing: '逐行播种', returning: '返航中', charging: '充电补种' };
function createSeedPanel(sim, fields, { resume, check, choose, follow }) {
    const region = $('seed-plan');
    const rows = fields.map((f, i) => {
        const row = document.createElement('div');
        row.className = 'seed-plan-row';
        const label = document.createElement('label'), status = document.createElement('small');
        label.htmlFor = 'seed-plan-' + i;
        label.textContent = f.id;
        label.append(status);
        const select = document.createElement('select');
        select.id = label.htmlFor;
        select.setAttribute('aria-label', f.id + ' 下季作物');
        select.add(new Option('跳过此田', 'skip'));
        seeding_js_1.CROPS.forEach((c, j) => select.add(new Option(c.name, String(j))));
        select.value = String(sim.plan[i]);
        select.addEventListener('change', () => check(sim.setPlan(i, select.value === 'skip' ? null : Number(select.value))));
        row.append(label, select);
        region.append(row);
        $('seed-target').add(new Option(f.id, String(i)));
        return { row, status, select };
    });
    $('seed-target').onchange = e => { choose(Number(e.target.value), true); render(); };
    $('seed-auto').onclick = () => { resume(); check(sim.setAutomatic(!sim.automatic)); };
    $('seed-dispatch').onclick = () => { resume(); check(sim.dispatch(Number($('seed-target').value))); };
    $('seed-return').onclick = () => { resume(); check(sim.returnHome()); };
    $('follow-seeder').onclick = () => follow('seeder');
    function render() {
        const d = sim.drone, i = Number($('seed-target').value), local = fields[i], why = sim.reason(i), any = sim.plan.some(x => x !== null);
        rows.forEach(({ row, status, select }, j) => {
            const f = fields[j];
            status.textContent = f.sowOrder ? '任务已锁定' : f.harvestable ? '在田 ' + f.name + ' · ' + f.harvestable + ' 批' : sim.groundClear(j) ? '空田 · 可播' : '等待无人车驶离';
            row.dataset.vacant = String(!f.sowOrder && !f.harvestable);
            select.disabled = !!f.sowOrder;
            select.value = sim.plan[j] === null ? 'skip' : String(sim.plan[j]);
            $('seed-target').options[j].textContent = f.id + ' · ' + (0, seeding_js_1.fieldLabel)(f);
        });
        $('seed-auto').setAttribute('aria-checked', String(sim.automatic));
        $('seed-auto').disabled = !any;
        $('seed-air-state').textContent = names[d.state];
        $('seed-battery').textContent = Math.round(d.battery) + '%';
        $('seed-payload').textContent = Math.round(d.seed) + '%';
        $('seed-dispatch').disabled = !!why || d.state !== 'ready' || sim.plan[i] === null;
        $('seed-return').disabled = !['outbound', 'sowing'].includes(d.state);
        const active = sim.order && d.target !== null;
        $('seed-progress-label').textContent = active ? (fields[d.target].id + ' · ' + seeding_js_1.CROPS[sim.order.crop].name + ' / ' + names[d.state]) : sim.automatic ? '自动值守 · 已启用' : '手动待命';
        $('seed-progress-value').textContent = active && d.state === 'sowing' ? Math.round(100 * d.progress) + '%' : '已播 ' + sim.completed + ' 块次';
        $('seed-bar').style.width = (active ? d.progress * 100 : 0) + '%';
        $('seed-instruction').textContent = active ? (d.state === 'sowing' ? '正在沿田垄投种，本田完成后自动返航补给。' : '已预留目标空田，正在飞往起播点。') :
            d.state === 'returning' || d.state === 'charging' ? names[d.state] + '，补给完成后可接下一块田。' :
                sim.automatic ? '按地块计划轮流作业。没有符合条件的空田时，播种机在总站等待。' :
                    why ? local.id + '：' + why + '。' : sim.plan[i] === null ? '该田已跳过，请先选择下季作物。' : local.id + ' 已空出，可立即播种' + seeding_js_1.CROPS[sim.plan[i]].name + '。';
    }
    render();
    return render;
}

});
