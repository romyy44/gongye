/* main.js */
QingheModules.define("main", function (exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seeding_js_1 = require("./seeding.js");
const seed_panel_js_1 = require("./seed-panel.js");
const paths = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
    sprout: '<path d="M12 21V10M12 15C4 15 3 7 3 7s9-1 9 8ZM12 11C12 3 21 3 21 3s1 9-9 11"/>',
    drone: '<path d="M9 9h6v6H9zM9 9 6 6m9 3 3-3M9 15l-3 3m9-3 3 3"/><ellipse cx="5" cy="5" rx="3.5" ry="2.4"/><ellipse cx="19" cy="5" rx="3.5" ry="2.4"/><ellipse cx="5" cy="19" rx="3.5" ry="2.4"/><ellipse cx="19" cy="19" rx="3.5" ry="2.4"/><path d="M11 12h2"/>',
    logs: '<path d="M8 4H5v17h14V4h-3M9 3h6v4H9zM8 11h8M8 15h8M8 18h5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 8.5a2.4 2.4 0 0 1 4.7.5c0 1.8-2.4 2-2.4 4M12 16.8v.2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    fields: '<path d="m3 6 8-3 10 3v14l-10 2-8-3Zm8-3v19M3 11l8 2 10-3M3 15l8 2 10-3"/>',
    droplet: '<path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
    irrigation: '<path d="M3 7h6l3 5h9v5H10L7 12H3ZM4 17l-1 3m5-3-1 3m5-2-1 3m5-3-1 3m5-3-1 3M12 7V3m-3 1 3-1 3 1"/>',
    focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
    topview: '<path d="m12 3 9 6-9 6-9-6Zm-9 11 9 6 9-6M12 9h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
    pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="m7 4 13 8-13 8Z"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    send: '<path d="m21 3-6 18-4-8-8-4Zm-10 10L21 3"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
    return: '<path d="M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10v4M5 10v4m3-4v4m3-4v4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    warning: '<path d="m12 3 10 18H2ZM12 9v5m0 3v.1"/>',
    leaf: '<path d="M20 3S8 1 4 9c-3 6 2 12 8 10 8-2 8-16 8-16ZM5 19 15 9"/>',
    warehouse: '<path d="m2 9 10-6 10 6v12H2ZM7 21V11h10v10M7 14h10M7 17h10"/>',
    arm: '<circle cx="8" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><path d="m9.5 6.5 4 4m0 3-3 4M6 6.5 3 14l4 5h9M10 17h5v4H5v-3m12-7 3-3 3 3m-6 2 3 3 3-3"/>',
    rover: '<path d="M4 10h13l3 4v4H3v-6ZM7 10V6h7v4M11 6V3m0 0 4 1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M20 13h2M6 13h6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.overview}</svg>`;
const hydrateIcons = (parent = document) => parent.querySelectorAll('i[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
hydrateIcons();
const $ = id => document.getElementById(id);
const fields = [
    { id: 'A01', name: '玉米', english: 'CORN', emoji: '🌽', color: '#bfca74', x: -12, z: -10, moisture: 42, maturity: 100, area: 4.2, temperature: 23.8, harvestable: 4, harvested: 0 },
    { id: 'A02', name: '番茄', english: 'TOMATO', emoji: '🍅', color: '#ce8a73', x: 12, z: -10, moisture: 58, maturity: 100, area: 3.6, temperature: 24.2, harvestable: 4, harvested: 0 },
    { id: 'A03', name: '胡萝卜', english: 'CARROT', emoji: '🥕', color: '#d6ad6c', x: -12, z: 12, moisture: 36, maturity: 76, area: 3.8, temperature: 23.6, harvestable: 4, harvested: 0 },
    { id: 'A04', name: '土豆', english: 'POTATO', emoji: '🥔', color: '#ada07c', x: 12, z: 12, moisture: 65, maturity: 100, area: 4.0, temperature: 24.0, harvestable: 4, harvested: 0 },
];
const stateNames = { ready: '待命中', outbound: '前往田块', irrigating: '灌溉作业', returning: '返航中', charging: '充电补水' };
fields.forEach(f => Object.assign(f, { nutrients: 30, fertilizerBoost: 1, fertilizerRemaining: 0, pickedBatches: 0, stagedBatches: 0, stagedLoads: [] }));
const harvestNames = { ready: '待命中', outbound: '前往集货区', descending: '下降提货', grabbing: '夹取已采作物', lifting: '载货爬升', transporting: '空运至传送带', dropping: '投放传送带', returning: '返航中', charging: '充电中' };
const robotNames = { collecting: '巡回提货', loading: '装载集货箱', toBelt: '整车送往输送带', feeding: '逐箱交付输送带', blocked: '无安全通路 · 已停车', ready: '等待手动调度', driving: '驶向田块', arrived: '已到达 · 待采摘', picking: '正在采摘', delivering: '送往大屏旁', unloading: '集货卸载中', returning: '返回总站', charging: '充电中' };
const fertilizerNames = { ready: '待命中', outbound: '前往施肥', fertilizing: '正在施肥', returning: '返航中', charging: '充电补肥' };
let seeder, renderSeed;
let selectedDrone = 0, selectedField = 0, paused = false, speed = 1, simulation, harvest, fertilizer, picker, advanceGrowth, world, camera, controls, renderer, scene, lighting, routes, selectionFrame, followDevice = null;
let cameraTransition = null, lastUI = -1, lastScreen = -1, pointerStart = null;
const eventLog = [];
function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i data-icon="${type === 'warning' ? 'warning' : type === 'success' ? 'check' : 'drone'}"></i><span></span>`;
    el.querySelector('span').textContent = message;
    hydrateIcons(el);
    $('toast-area').append(el);
    while ($('toast-area').children.length > 3)
        $('toast-area').firstChild.remove();
    setTimeout(() => el.remove(), 4200);
}
function onEvent(event) { eventLog.unshift(event); if (eventLog.length > 100)
    eventLog.pop(); toast(event.message, event.type); }
function showHelp() {
    $('dialog-title').textContent = '播种、采摘与协同转运';
    $('dialog-content').innerHTML = "<div class=\"guide-step\"><b>01</b><div><strong>灌溉与施肥</strong>灌溉机队提高土壤湿度；切换「施肥无人机」选择未成熟田块并开始施肥。施肥带来持续 180 个模拟秒的 3× 成熟增益，成熟度与养分会实时变化。</div></div><div class=\"guide-step\"><b>02</b><div><strong>手动驾驶无人车前往田块</strong>切换「采摘无人车」，选择目标田块并点击「驾驶前往」。到达后无人车会等待，不会自行采摘。</div></div><div class=\"guide-step\"><b>03</b><div><strong>手动确认采摘并送至大屏旁</strong>成熟度达到 90% 后，点击「开始采摘」。默认一次收齐整田，每批 25 kg，在大屏旁整车卸货；也可选择只采一批。使用「清运全部待运货物」，无人车将巡访各田的大屏，一趟将尚未分配的货箱送到传送带。</div></div><div class=\"guide-step\"><b>04</b><div><strong>无人机转运与入库</strong>切换「货运无人机」，选择已有待转运作物的集货区，点击「前往转运」。也可开启「自动转运入库」处理已有集货箱；它不会替你驾驶或调度采摘无人车。货物经过传送带进入仓内后才计入库存。</div></div><div class=\"guide-step\"><b>05</b><div><strong>观察大屏与三维设备</strong>四块田地的大屏显示成熟度、土壤湿度、养分、施肥增益、未采和待转运批次。可跟随无人车、施肥机与货运机观察作业，或查看集货区和仓库。</div></div><div class=\"guide-step\"><b>06</b><div><strong>给空田安排下一季</strong>在「播种无人机」为每块田选下季作物，或跳过该田。开启「全自动播种」后，只有本田采完且无人车驶离才会起飞。播种完毕从 0% 开始生长；集货平台上的旧货仍可照常转运。</div></div><div class=\"guide-note\">每田初始 4 批作物。玉米、番茄、土豆已成熟，胡萝卜可先施肥加速生长。暂停与 1× / 2× / 4× 倍速对整个农场生效。所有作业与传感器数据均为浏览器本地模拟；刷新会重置。</div>";
    $('info-dialog').showModal();
}
function showLogs() {
    $('dialog-title').textContent = '作业记录';
    $('dialog-content').innerHTML = eventLog.length ? eventLog.map(e => `<div class="log-row"><time>${new Date(e.time).toLocaleTimeString('zh-CN', { hour12: false })}</time><span></span></div>`).join('') : '<div class="log-empty">暂无作业记录，派发一个灌溉任务开始吧。</div>';
    $('dialog-content').querySelectorAll('.log-row span').forEach((el, i) => el.textContent = eventLog[i].message);
    $('info-dialog').showModal();
}
$('guide-button').addEventListener('click', showHelp);
$('help-button').addEventListener('click', showHelp);
$('close-dialog').addEventListener('click', () => $('info-dialog').close());
$('info-dialog').addEventListener('click', e => { if (e.target === $('info-dialog')) {
    const r = e.target.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        e.target.close();
} });
function createCards() {
    $('field-cards').innerHTML = fields.map((f, i) => `<button class="field-card ${i === 0 ? 'selected' : ''}" data-field="${i}" aria-label="选择${f.name}田" aria-pressed="${i === 0}"><div class="field-card-head"><span class="crop-icon" aria-hidden="true">${f.emoji}</span><div><strong>${f.name}种植区</strong><small>${f.english} PLANTATION</small></div><span class="field-code">${f.id}</span></div><div class="field-stats"><div><span class="field-stat-label"><i data-icon="leaf"></i>作物成熟度</span><div class="field-stat-value">${f.maturity}<small>%</small></div><div class="field-progress"><span style="width:${f.maturity}%"></span></div></div><div><span class="field-stat-label"><i data-icon="droplet"></i>土壤湿度</span><div class="field-stat-value ${f.moisture < 45 ? 'dry' : ''}" id="field-moisture-${i}">${f.moisture}<small>%</small></div><div class="field-progress moisture"><span id="field-bar-${i}" style="width:${f.moisture}%"></span></div></div></div><div class="field-bottom"><span id="field-condition-${i}" class="field-condition ${f.moisture < 45 ? 'dry' : ''}"><b></b>${f.moisture < 45 ? '建议灌溉' : '生长状态良好'}</span><span>${f.temperature.toFixed(1)}°C <span>·</span> ${f.area.toFixed(1)} 亩</span></div></button>`).join('');
    hydrateIcons($('field-cards'));
    document.querySelectorAll('.field-card').forEach(el => el.addEventListener('click', () => selectField(Number(el.dataset.field), true)));
    $('drone-list').innerHTML = Array.from({ length: 4 }, (_, i) => `<button class="drone-row ${i === 0 ? 'selected' : ''}" data-drone="${i}" aria-label="选择 UAV-0${i + 1}" aria-pressed="${i === 0}"><span class="drone-thumbnail"><i data-icon="drone"></i></span><div><div class="drone-name">UAV-0${i + 1}</div><div class="drone-meta"><span><i data-icon="battery"></i><span id="battery-${i}">100%</span><span class="battery-track"><b id="battery-bar-${i}" style="width:100%"></b></span></span><span><i data-icon="droplet"></i><span id="water-${i}">100%</span></span></div></div><div class="drone-state" id="drone-state-${i}"><span><b class="state-dot"></b><span id="state-${i}">待命中</span></span><small id="drone-task-${i}">充电位 0${i + 1}</small></div></button>`).join('');
    hydrateIcons($('drone-list'));
    document.querySelectorAll('.drone-row').forEach(el => el.addEventListener('click', () => selectDrone(Number(el.dataset.drone))));
    document.querySelectorAll('.field-card').forEach((el, i) => el.querySelector('.field-bottom').insertAdjacentHTML('beforebegin', `<div class="field-harvest" id="field-harvest-${i}"></div>`));
    $('inventory-crops').innerHTML = seeding_js_1.CROPS.map((f, i) => `<div><span>${f.emoji} ${f.name}</span><b id="inventory-crop-${i}">0 kg</b></div>`).join('');
}
function setFleetTab(tab) { for (const name of ['seeder', 'irrigation', 'fertilizer', 'robot', 'harvest']) {
    $(`${name}-controls`).hidden = name !== tab;
    $(`${name}-tab`).setAttribute('aria-selected', String(name === tab));
} if (followDevice !== tab)
    setFollow(false); }
function refreshFollowButtons() { for (const name of ['harvest', 'robot', 'fertilizer', 'seeder'])
    $(name === 'harvest' ? 'follow-harvester' : `follow-${name}`).setAttribute('aria-pressed', String(followDevice === name)); }
function setFollow(value) { followDevice = value ? 'harvest' : null; refreshFollowButtons(); }
function toggleFollow(device) { followDevice = followDevice === device ? null : device; cameraTransition = null; refreshFollowButtons(); }
$('seeder-tab').onclick = () => setFleetTab('seeder');
$('seed-open-rover').onclick = () => { selectField(Number($('seed-target').value)); setFleetTab('robot'); };
$('irrigation-tab').addEventListener('click', () => setFleetTab('irrigation'));
$('harvest-tab').addEventListener('click', () => setFleetTab('harvest'));
$('fertilizer-tab').addEventListener('click', () => setFleetTab('fertilizer'));
$('robot-tab').addEventListener('click', () => setFleetTab('robot'));
$('follow-harvester').addEventListener('click', () => toggleFollow('harvest'));
$('follow-robot').addEventListener('click', () => toggleFollow('robot'));
$('follow-fertilizer').addEventListener('click', () => toggleFollow('fertilizer'));
$('warehouse-view').addEventListener('click', () => { if (!camera)
    return; setFollow(false); setView(new camera.position.constructor(65, 28, 39), new camera.position.constructor(40, 2, 1)); });
$('harvest-dispatch').addEventListener('click', () => { if (!harvest)
    return; resume(); checkResult(harvest.dispatch(Number($('harvest-target').value))); });
$('harvest-return').addEventListener('click', () => { if (!harvest)
    return; resume(); if (harvest.automatic)
    harvest.setAutomatic(false); checkResult(harvest.returnHome()); });
$('harvest-auto').addEventListener('click', () => { if (!harvest)
    return; resume(); harvest.setAutomatic(!harvest.automatic); updateUI(); });
$('harvest-target').addEventListener('change', e => selectField(Number(e.target.value), true));
$('fertilizer-target').addEventListener('change', e => { selectField(Number(e.target.value), true); updateUI(); });
$('robot-target').addEventListener('change', e => { selectField(Number(e.target.value), true); updateUI(); });
$('fertilizer-dispatch').addEventListener('click', () => { if (!fertilizer)
    return; resume(); checkResult(fertilizer.dispatch(Number($('fertilizer-target').value))); });
$('fertilizer-return').addEventListener('click', () => { if (!fertilizer)
    return; resume(); checkResult(fertilizer.returnHome()); });
$('robot-drive').addEventListener('click', () => { if (!picker)
    return; resume(); checkResult(picker.driveTo(Number($('robot-target').value))); });
$('robot-pick').addEventListener('click', () => { if (!picker)
    return; resume(); checkResult(picker.startPicking($('robot-mode').value)); });
$('robot-haul').onclick = () => { if (!picker || !harvest)
    return; resume(); checkResult(picker.haulAll(harvest)); };
$('robot-return').addEventListener('click', () => { if (!picker)
    return; resume(); checkResult(picker.returnHome()); });
$('switch-to-transport').addEventListener('click', () => { setFleetTab('harvest'); if (picker && picker.robot.target !== null)
    selectField(picker.robot.target); });
function viewStage() { if (!camera || !world)
    return; const i = Number($('robot-target').value), p = world.logistics.stagePoints[i]; setFollow(false); setView(new camera.position.constructor(p.x + 12, 13, p.z + 15), new camera.position.constructor(p.x - 2, 1.6, p.z - 1)); }
$('robot-stage-view').addEventListener('click', viewStage);
$('fertilizer-field-view').addEventListener('click', () => { if (!camera)
    return; const f = fields[Number($('fertilizer-target').value)]; setFollow(false); setView(new camera.position.constructor(f.x + 19, 23, f.z + 24), new camera.position.constructor(f.x, 1, f.z)); });
function selectDrone(i) {
    selectedDrone = i;
    document.querySelectorAll('.drone-row').forEach((el, j) => { el.classList.toggle('selected', i === j); el.setAttribute('aria-pressed', String(i === j)); });
    if (simulation?.drones[i].target !== null && simulation?.drones[i].target !== undefined)
        selectField(simulation.drones[i].target, false);
    $('selected-drone-name').textContent = `UAV-0${i + 1}`;
    updateUI();
}
function selectField(i, showPopup = false) {
    selectedField = i;
    for (const id of ['target-field', 'harvest-target', 'robot-target', 'fertilizer-target', 'seed-target'])
        $(id).value = String(i);
    document.querySelectorAll('.field-card').forEach((el, j) => { el.classList.toggle('selected', i === j); el.setAttribute('aria-pressed', String(i === j)); });
    if (selectionFrame) {
        selectionFrame.position.set(fields[i].x, .66, fields[i].z);
    }
    if (showPopup) {
        const f = fields[i];
        $('field-popup').innerHTML = `<strong>${f.id} · ${(0, seeding_js_1.fieldLabel)(f)}</strong>成熟度 ${f.harvestable ? f.maturity.toFixed(1) + "%" : "—"}　湿度 ${f.moisture.toFixed(1)}%<br>养分 ${f.nutrients.toFixed(0)}% · 生长 ${f.fertilizerBoost}× · 待运 ${f.stagedBatches} 批`;
        $('field-popup').hidden = false;
        clearTimeout(selectField.timer);
        selectField.timer = setTimeout(() => $('field-popup').hidden = true, 4000);
    }
}
function updateUI() {
    if (!simulation)
        return;
    renderSeed?.();
    const busy = (seeder && !['ready', 'charging'].includes(seeder.drone.state) ? 1 : 0) + simulation.drones.filter(d => ['outbound', 'irrigating', 'returning'].includes(d.state)).length + (harvest && !['ready', 'charging'].includes(harvest.drone.state) ? 1 : 0) + (fertilizer && !['ready', 'charging'].includes(fertilizer.drone.state) ? 1 : 0);
    const charging = (seeder?.drone.state === 'charging' ? 1 : 0) + simulation.drones.filter(d => d.state === 'charging').length + (harvest?.drone.state === 'charging' ? 1 : 0) + (fertilizer?.drone.state === 'charging' ? 1 : 0);
    const roverBusy = picker && !['ready', 'arrived', 'charging'].includes(picker.robot.state);
    $('fleet-note').textContent = busy ? `${busy} 架作业${roverBusy ? ' · 车作业中' : ''}` : roverBusy ? '无人车作业中' : charging ? `${charging} 架补给中` : '另有 1 辆无人车';
    $('avg-moisture').textContent = (fields.reduce((s, f) => s + f.moisture, 0) / 4).toFixed(1);
    $('water-used').textContent = simulation.metrics.waterUsed.toFixed(1);
    $('mission-count').textContent = `${simulation.metrics.totalMissions} 次作业`;
    const minutes = Math.floor(simulation.elapsed / 60), seconds = Math.floor(simulation.elapsed % 60);
    $('sim-time').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    simulation.drones.forEach((d, i) => {
        $(`battery-${i}`).textContent = `${Math.round(d.battery)}%`;
        $(`water-${i}`).textContent = `${Math.round(d.water)}%`;
        $(`battery-bar-${i}`).style.width = `${d.battery}%`;
        $(`battery-bar-${i}`).style.background = d.battery < 30 ? '#c7a666' : '#9cb982';
        $(`state-${i}`).textContent = stateNames[d.state];
        $(`drone-state-${i}`).className = `drone-state ${['irrigating', 'outbound'].includes(d.state) ? 'working' : d.state}`;
        $(`drone-task-${i}`).textContent = d.target !== null ? `${fields[d.target].id} · ${d.state === 'irrigating' ? `${Math.round(d.progress * 100)}%` : fields[d.target].name}` : `充电位 0${i + 1}`;
    });
    const chosen = simulation.drones[selectedDrone];
    $('dispatch-button').disabled = chosen.state !== 'ready';
    $('return-button').disabled = ['returning', 'charging'].includes(chosen.state) || (chosen.state === 'ready' && chosen.battery >= 100 && chosen.water >= 100);
    $('auto-toggle').setAttribute('aria-checked', String(simulation.automatic));
    $('ripe-count').textContent = `${fields.filter(f => f.maturity >= 90 && f.harvestable > 0).length} 块可采收`;
    fields.forEach((f, i) => {
        $(`field-moisture-${i}`).innerHTML = `${f.moisture.toFixed(1)}<small>%</small>`;
        $(`field-moisture-${i}`).classList.toggle('dry', f.moisture < 45);
        $(`field-bar-${i}`).style.width = `${f.moisture}%`;
        const workers = simulation.drones.some(d => d.target === i && d.state === 'irrigating');
        $(`field-condition-${i}`).innerHTML = `<b></b>${workers ? '正在灌溉' : f.moisture < 45 ? '建议灌溉' : '生长状态良好'}`;
        $(`field-condition-${i}`).classList.toggle('dry', f.moisture < 45 && !workers);
        const maturityValue = document.querySelectorAll('.field-card')[i].querySelector('.field-stats .field-stat-value');
        maturityValue.innerHTML = `${f.maturity.toFixed(0)}<small>%</small>`;
        maturityValue.nextElementSibling.firstElementChild.style.width = `${f.maturity}%`;
        const card = document.querySelectorAll('.field-card')[i], title = f.harvestable ? f.name + '种植区' : (0, seeding_js_1.fieldLabel)(f);
        card.setAttribute('aria-label', '选择 ' + f.id + ' ' + title);
        card.querySelector('.field-card-head strong').textContent = title;
        card.querySelector('.crop-icon').textContent = f.harvestable ? f.emoji : '🌱';
        card.querySelector('.field-card-head small').textContent = f.harvestable ? f.english + ' · 第 ' + f.season + ' 季' : 'FALLOW · 待播田块';
        $('target-field').options[i].textContent = f.id + ' · ' + (0, seeding_js_1.fieldLabel)(f);
        if (!f.harvestable) {
            maturityValue.textContent = '—';
            $('field-condition-' + i).textContent = f.sowOrder ? '播种任务中' : '空田待播';
        }
        f.robotState = picker?.robot.target === i ? robotNames[picker.robot.state] : '等待手动采摘';
        $(`field-harvest-${i}`).innerHTML = `<span class="${f.maturity >= 90 ? 'ripe' : ''}"><i data-icon="${f.maturity >= 90 ? 'check' : 'leaf'}"></i>${!f.harvestable ? (f.sowOrder ? '播种任务中' : '空田 · 本季已采完') : f.maturity >= 90 ? '成熟 · 待无人车采摘' : '生长中 · 暂不可采'}</span><b>未采 ${f.harvestable} · 待运 ${f.stagedBatches}</b><span class="field-nutrient">养分 ${f.nutrients.toFixed(0)}% <strong>${f.fertilizerBoost}× 生长</strong></span>`;
        hydrateIcons($(`field-harvest-${i}`));
    });
    if (harvest) {
        const d = harvest.drone;
        $('harvester-state').textContent = harvestNames[d.state];
        $('harvester-state').dataset.state = d.state;
        $('harvester-battery').textContent = `${Math.round(d.battery)}%`;
        $('harvest-load').textContent = d.carrying && d.load ? `${d.load.crop} · ${d.load.weight} kg` : '空载';
        $('harvest-dispatch').disabled = d.state !== 'ready';
        $('harvest-return').disabled = ['ready', 'charging', 'returning'].includes(d.state);
        $('harvest-auto').setAttribute('aria-checked', String(harvest.automatic));
        Array.from($('harvest-target').options).forEach((option, i) => { const f = fields[i]; option.textContent = `${f.id} · ${f.stagedLoads[0]?.crop || (0, seeding_js_1.fieldLabel)(f)} ｜待转运 ${f.stagedBatches} 批`; });
        const stagedTotal = fields.reduce((sum, f) => sum + f.stagedBatches, 0);
        $('staging-summary').textContent = stagedTotal ? `各大屏旁共有 ${stagedTotal} 批待提货` : '等待机器人采摘并集货';
        const step = ['descending', 'grabbing'].includes(d.state) ? 0 : ['lifting', 'transporting', 'dropping'].includes(d.state) ? 1 : harvest.parcels.length ? 2 : -1;
        document.querySelectorAll('[data-harvest-step]').forEach((el, i) => { el.classList.toggle('active', i === step); el.classList.toggle('done', i < step || i === 2 && harvest.inventory.totalBatches > 0 && step < 0); });
        $('belt-progress').textContent = harvest.parcels.length ? `${harvest.parcels.length} 批输送中 · ${Math.round(harvest.parcels[0].progress * 100)}%` : '传送带待机';
        $('inventory-weight').textContent = harvest.inventory.totalWeight.toFixed(0);
        $('inventory-batches').textContent = `${harvest.inventory.totalBatches} 批入库`;
        seeding_js_1.CROPS.forEach((f, i) => $(`inventory-crop-${i}`).textContent = `${harvest.inventory.byCrop[f.name]?.weight || 0} kg`);
    }
    if (fertilizer) {
        const d = fertilizer.drone, f = fields[Number($('fertilizer-target').value)];
        $('fertilizer-state').textContent = fertilizerNames[d.state];
        $('fertilizer-battery').textContent = `${Math.round(d.battery)}%`;
        $('fertilizer-payload').textContent = `${Math.round(d.fertilizer)}%`;
        $('fertilizer-dispatch').disabled = d.state !== 'ready';
        $('fertilizer-return').disabled = ['ready', 'returning', 'charging'].includes(d.state);
        $('fertilizer-field-code').textContent = f.id;
        $('fertilizer-maturity').textContent = f.maturity.toFixed(1);
        $('fertilizer-boost').textContent = `${f.fertilizerBoost}×`;
        $('fertilizer-maturity-bar').style.width = `${f.maturity}%`;
        $('fertilizer-nutrients').textContent = `${f.nutrients.toFixed(0)}%`;
        $('fertilizer-moisture').textContent = `${f.moisture.toFixed(1)}%`;
        $('fertilizer-effect').textContent = `${Math.ceil(f.fertilizerRemaining)} s`;
        $('fertilizer-total').textContent = `${fertilizer.metrics.fertilizerUsed.toFixed(1)} kg`;
        Array.from($('fertilizer-target').options).forEach((o, i) => { o.textContent = `${fields[i].id} · ${(0, seeding_js_1.fieldLabel)(fields[i])} ｜成熟 ${fields[i].maturity.toFixed(0)}%`; });
    }
    if (picker) {
        const robot = picker.robot;
        const pending = picker.pendingHaul();
        const selected = Number($('robot-target').value);
        const field = fields[selected];
        const idle = ['ready', 'arrived'].includes(robot.state);
        const loadWeight = robot.loads.reduce((sum, load) => sum + load.weight, 0);
        $('robot-haul').disabled = !pending || !idle || robot.battery < 25;
        $('bulk-count').textContent = picker.haul
            ? '本趟 ' + robot.jobSize + ' 批 · 已装 ' + robot.jobDone + ' 批'
            : '待清运 ' + pending + ' 批 · ' + pending * 25 + ' kg';
        $('robot-state').textContent = robotNames[robot.state];
        $('robot-battery').textContent = robot.battery.toFixed(0) + '%';
        $('robot-load').textContent = robot.carrying ? robot.loads.length + ' 批 · ' + loadWeight + ' kg' : '空载';
        $('robot-drive').disabled = !idle || !field.harvestable;
        $('robot-pick').disabled = robot.state !== 'arrived' || robot.target !== selected || field.maturity < 90 || field.harvestable <= 0;
        $('robot-return').disabled = ['returning', 'charging'].includes(robot.state);
        $('robot-progress').style.width = robot.progress * 100 + '%';
        $('robot-progress-label').textContent = robotNames[robot.state] + (robot.target !== null ? ' · ' + fields[robot.target].id : '');
        let instruction = robotNames[robot.state];
        if (robot.state === 'arrived')
            instruction = '已到 ' + fields[robot.target].id + '，请手动点击「开始采摘」';
        if (robot.state === 'ready')
            instruction = '选择田块采摘，或清运大屏旁的待运货箱';
        if (robot.state === 'picking')
            instruction = '本次已装 ' + robot.jobDone + ' / ' + robot.jobSize + ' 批，收齐后一次集货';
        if (['delivering', 'unloading'].includes(robot.state))
            instruction = '整车 ' + robot.loads.length + ' 批，送往本田大屏旁';
        if (picker.haul)
            instruction = '本趟共 ' + robot.jobSize + ' 批，已提货 ' + robot.jobDone + ' 批 · ' + robotNames[robot.state];
        $('robot-instruction').textContent = instruction;
        $('robot-field-code').textContent = field.id;
        $('robot-unpicked').textContent = field.harvestable;
        $('robot-staged').textContent = field.stagedBatches;
        $('robot-picked-total').textContent = picker.metrics.pickedBatches;
        Array.from($('robot-target').options).forEach((option, index) => {
            const target = fields[index];
            option.textContent = target.id + ' · ' + (0, seeding_js_1.fieldLabel)(target) + ' ｜' + target.maturity.toFixed(0) + '% · 未采' + target.harvestable;
        });
    }
}
function setPaused(value) { paused = value; $('pause-button').innerHTML = `<i data-icon="${paused ? 'play' : 'pause'}"></i>`; $('pause-button').setAttribute('aria-label', paused ? '继续模拟' : '暂停模拟'); $('pause-button').title = paused ? '继续模拟' : '暂停模拟'; hydrateIcons($('pause-button')); }
function resume() { if (paused)
    setPaused(false); }
function checkResult(result) { if (!result.ok)
    toast(result.message, 'warning'); updateUI(); }
createCards();
$('target-field').addEventListener('change', e => selectField(Number(e.target.value), true));
$('dispatch-button').addEventListener('click', () => { if (!simulation)
    return; resume(); checkResult(simulation.dispatch(selectedDrone, Number($('target-field').value))); });
$('return-button').addEventListener('click', () => { if (!simulation)
    return; resume(); checkResult(simulation.returnHome(selectedDrone)); });
$('dispatch-all').addEventListener('click', () => { if (!simulation)
    return; resume(); const results = simulation.dispatchAll(); if (!results.some(r => r.ok))
    toast('当前无人机均在作业或补给中，请稍后再试。', 'warning');
else if (results.some(r => !r.ok))
    toast('已派发可用无人机，其余无人机继续当前任务。'); updateUI(); });
$('return-all').addEventListener('click', () => { if (!simulation)
    return; resume(); simulation.setAutomatic(false); const results = simulation.returnAll(); if (!results.some(r => r.ok))
    toast('所有无人机已返航或处于充电位。'); updateUI(); });
$('auto-toggle').addEventListener('click', () => { if (!simulation)
    return; resume(); simulation.setAutomatic(!simulation.automatic); updateUI(); });
$('pause-button').addEventListener('click', () => { setPaused(!paused); toast(paused ? '模拟已暂停，传感器与无人机状态已冻结。' : '模拟已继续。'); });
$('speed-button').addEventListener('click', () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; $('speed-button').textContent = `${speed}×`; toast(`模拟速度：${speed}×`); });
document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => {
    const nav = button.dataset.nav;
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el === button));
    if (nav === 'logs')
        showLogs();
    else if (nav === 'fields') {
        $('fields-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        selectField(selectedField, true);
    }
    else if (nav === 'fleet') {
        $('fleet-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
        selectDrone(selectedDrone);
    }
    else if (nav === 'logistics') {
        setFleetTab('harvest');
        $('fleet-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
        $('warehouse-view').click();
    }
    else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        resetView();
    }
}));
function updateClock() { $('clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }); }
updateClock();
setInterval(updateClock, 1000);
function setView(position, target) { if (camera && controls)
    cameraTransition = { from: camera.position.clone(), to: position, oldTarget: controls.target.clone(), target, start: performance.now() }; }
function cameraFit() { return Math.min(1.8, Math.max(1, Math.pow(1.65 / (camera?.aspect || 1.8), .65))); }
function resetView() { if (!camera)
    return; setFollow(false); const target = new camera.position.constructor(2, 0, 7), offset = new camera.position.constructor(82, 80, 104).multiplyScalar(cameraFit()); setView(target.clone().add(offset), target); }
$('view-reset').addEventListener('click', resetView);
$('view-river').addEventListener('click', () => { if (!camera)
    return; setFollow(false); setView(new camera.position.constructor(46, 30, 78), new camera.position.constructor(3, -.2, 34)); });
$('view-top').addEventListener('click', () => { if (!camera)
    return; setFollow(false); setView(new camera.position.constructor(2, 130 * cameraFit(), 18), new camera.position.constructor(2, 0, 0)); });
function zoom(factor) { if (!camera || !controls)
    return; const delta = camera.position.clone().sub(controls.target).multiplyScalar(factor); delta.clampLength(45, 180); setView(controls.target.clone().add(delta), controls.target.clone()); }
$('zoom-in').addEventListener('click', () => zoom(.83));
$('zoom-out').addEventListener('click', () => zoom(1.2));
$('light-preset').addEventListener('change', e => lighting?.setPreset(e.target.value));
async function initializeScene() {
    const [THREE, { OrbitControls }, { createWorld }, { FarmSimulation }, { HarvestSimulation }, { createLighting }, { FertilizerSimulation, advanceGrowth: grow }, { RobotSimulation }] = await Promise.all([Promise.resolve().then(() => require('three')), Promise.resolve().then(() => require('three/addons/controls/OrbitControls.js')), Promise.resolve().then(() => require('./world.js')), Promise.resolve().then(() => require('./simulation.js')), Promise.resolve().then(() => require('./harvest.js')), Promise.resolve().then(() => require('./lighting.js')), Promise.resolve().then(() => require('./fertilizer.js')), Promise.resolve().then(() => require('./robot.js'))]);
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#edf1e9');
    camera = new THREE.PerspectiveCamera(36, 1, .1, 500);
    camera.position.set(84, 80, 111);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .98;
    $('scene').appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(2, 0, 7);
    controls.enableDamping = true;
    controls.dampingFactor = .07;
    controls.minDistance = 8;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI * .47;
    controls.minPolarAngle = .12;
    controls.enablePan = true;
    controls.panSpeed = .65;
    controls.rotateSpeed = .6;
    controls.zoomSpeed = .8;
    controls.addEventListener('start', () => { cameraTransition = null; setFollow(false); });
    lighting = createLighting(THREE, scene, renderer);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: '#d8ded6', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.34;
    ground.receiveShadow = true;
    scene.add(ground);
    world = createWorld(THREE, scene, fields);
    simulation = new FarmSimulation(fields, world.pads, onEvent);
    fertilizer = new FertilizerSimulation(fields, world.fertilizer.pad, onEvent);
    picker = new RobotSimulation(fields, world.logistics, onEvent);
    seeder = new seeding_js_1.SeedingSimulation(fields, world.seeder.pad, onEvent, i => picker.clearForSeeding(i));
    renderSeed = (0, seed_panel_js_1.createSeedPanel)(seeder, fields, { resume, check: checkResult, choose: selectField, follow: toggleFollow });
    advanceGrowth = grow;
    harvest = new HarvestSimulation(fields, world.logistics, onEvent);
    world.drones.forEach(d => d.spray.scale.y = 1.45);
    const framePoints = [[-10.35, 0, -7.85], [10.35, 0, -7.85], [10.35, 0, 7.85], [-10.35, 0, 7.85], [-10.35, 0, -7.85]].map(p => new THREE.Vector3(...p));
    selectionFrame = new THREE.Line(new THREE.BufferGeometry().setFromPoints(framePoints), new THREE.LineBasicMaterial({ color: '#ebf6c1', transparent: true, opacity: .85 }));
    scene.add(selectionFrame);
    selectionFrame.position.set(fields[0].x, .66, fields[0].z);
    routes = simulation.drones.map((d, i) => { const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: ['#7aa98d', '#8daabd', '#c3ae73', '#ac98b6'][i], dashSize: .7, gapSize: .5, transparent: true, opacity: .65 })); line.visible = false; scene.add(line); return line; });
    // Cargo uses the same geometry while held and on the conveyor: its base is .7 below the gripper anchor.
    const crateMaterial = new THREE.MeshStandardMaterial({ color: '#d4bc88', roughness: .7, metalness: .02 });
    const crateGeometry = new THREE.BoxGeometry(1, 1, 1), fruitGeometry = new THREE.SphereGeometry(1, 10, 7), carrotGeometry = new THREE.ConeGeometry(1, 1, 10);
    const fruitMaterials = ['#e2bf4d', '#da513e', '#dd8d35', '#ae956d'].map(color => new THREE.MeshStandardMaterial({ color, roughness: .57 }));
    const cargoLabels = seeding_js_1.CROPS.map(f => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const ctx = c.getContext('2d'); ctx.fillStyle = '#f5f1dc'; ctx.fillRect(0, 0, 256, 96); ctx.fillStyle = '#3b5945'; ctx.textAlign = 'center'; ctx.font = '600 30px "Microsoft YaHei",sans-serif'; ctx.fillText(`${f.name} · 25 kg`, 128, 60); const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map, toneMapped: false }); });
    function createCargo(load) {
        const index = seeding_js_1.CROPS.findIndex(c => c.name === load.crop);
        const group = new THREE.Group(), parts = [{ x: 0, y: -.66, z: 0, sx: 1.35, sy: .08, sz: 1.1 }, { x: -.16, y: -.07, z: 0, sx: .055, sy: .3, sz: .055 }, { x: .16, y: -.07, z: 0, sx: .055, sy: .3, sz: .055 }, { x: 0, y: .075, z: 0, sx: .37, sy: .055, sz: .055 }];
        for (const x of [-.62, .62])
            for (const z of [-.49, .49])
                parts.push({ x, y: -.38, z, sx: .09, sy: .55, sz: .09 });
        for (const y of [-.52, -.28]) {
            for (const z of [-.51, .51])
                parts.push({ x: 0, y, z, sx: 1.34, sy: .15, sz: .07 });
            for (const x of [-.65, .65])
                parts.push({ x, y, z: 0, sx: .07, sy: .15, sz: 1.04 });
        }
        const wood = new THREE.InstancedMesh(crateGeometry, crateMaterial, parts.length), dummy = new THREE.Object3D();
        parts.forEach((p, i) => { dummy.position.set(p.x, p.y, p.z); dummy.scale.set(p.sx, p.sy, p.sz); dummy.updateMatrix(); wood.setMatrixAt(i, dummy.matrix); });
        wood.castShadow = wood.receiveShadow = true;
        group.add(wood);
        const fruit = new THREE.InstancedMesh(index === 2 ? carrotGeometry : fruitGeometry, fruitMaterials[index], 9);
        for (let i = 0; i < 9; i++) {
            dummy.position.set((i % 3 - 1) * .35, -.22 + Math.floor(i / 6) * .14, (Math.floor(i / 3) - 1) * .29);
            dummy.rotation.set(index === 0 ? .6 : index === 2 ? Math.PI : 0, Math.sin(i) * .3, .15 * Math.sin(i));
            dummy.scale.set(index === 0 ? .11 : index === 2 ? .09 : .18, index === 0 ? .38 : index === 2 ? .52 : .17, index === 0 ? .11 : .17);
            dummy.updateMatrix();
            fruit.setMatrixAt(i, dummy.matrix);
        }
        fruit.castShadow = true;
        group.add(fruit);
        const label = new THREE.Mesh(new THREE.PlaneGeometry(.82, .3), cargoLabels[index]);
        label.position.set(0, -.4, .554);
        group.add(label);
        return group;
    }
    const stageModels = new Map();
    let heldCargo = null, heldKey = null;
    function disposeCargo(object) { object.traverse(child => { if (child.isInstancedMesh)
        child.dispose();
    else if (child.isMesh)
        child.geometry.dispose(); }); }
    const parcelModels = new Map(), harvestRoute = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#b9a064', dashSize: .8, gapSize: .45, transparent: true, opacity: .8 }));
    scene.add(harvestRoute);
    harvestRoute.visible = false;
    let harvestRouteKey = '';
    function syncHarvest(time, dt) {
        const d = harvest.drone, model = world.logistics.harvester;
        model.group.position.set(d.position.x, d.position.y, d.position.z);
        const moving = !['ready', 'charging'].includes(d.state);
        if (moving) {
            const delta = Math.atan2(Math.sin(d.heading - model.group.rotation.y), Math.cos(d.heading - model.group.rotation.y));
            model.group.rotation.y += delta * Math.min(1, dt * 5);
            model.rotors.forEach((r, i) => r.rotation.y += dt * 44 * (i % 2 ? 1 : -1));
        }
        const stow = [1.35, -2.7, 2.92];
        model.armJoints.forEach((joint, i) => joint.rotation.z = stow[i] * (1 - d.armExtension));
        model.gripper.fingers.forEach(finger => finger.position.x = finger.userData.side * (.25 - .13 * d.grip));
        if (d.carrying && d.load) {
            if (heldKey !== d.load.id) {
                if (heldCargo) {
                    model.cargoSocket.remove(heldCargo);
                    disposeCargo(heldCargo);
                }
                heldCargo = createCargo(d.load);
                model.cargoSocket.add(heldCargo);
                heldKey = d.load.id;
            }
            heldCargo.rotation.z = -model.armJoints.reduce((sum, joint) => sum + joint.rotation.z, 0);
        }
        else if (heldCargo) {
            model.cargoSocket.remove(heldCargo);
            disposeCargo(heldCargo);
            heldCargo = null;
            heldKey = null;
        }
        // The visible pallet represents the queued lot; each screen shows the exact batch count.
        fields.forEach((field, i) => { const first = field.stagedLoads[0], existing = stageModels.get(i); if (!first) {
            if (existing) {
                scene.remove(existing.group);
                disposeCargo(existing.group);
                stageModels.delete(i);
            }
            return;
        } if (existing?.id !== first.id) {
            if (existing) {
                scene.remove(existing.group);
                disposeCargo(existing.group);
            }
            const group = createCargo(first), p = world.logistics.stagePoints[i];
            group.position.set(p.x, p.y, p.z);
            scene.add(group);
            stageModels.set(i, { id: first.id, group });
        } });
        const live = new Set(harvest.parcels.map(p => p.id));
        for (const [id, object] of parcelModels)
            if (!live.has(id)) {
                scene.remove(object);
                disposeCargo(object);
                parcelModels.delete(id);
            }
        for (const p of harvest.parcels) {
            if (!parcelModels.has(p.id)) {
                const cargo = createCargo(p);
                scene.add(cargo);
                parcelModels.set(p.id, cargo);
            }
            const object = parcelModels.get(p.id);
            object.position.set(p.position.x, p.position.y + .7, p.position.z);
        }
        const key = `${d.state}-${d.target}`;
        if (key !== harvestRouteKey) {
            harvestRouteKey = key;
            harvestRoute.visible = moving && d.target !== null;
            if (harvestRoute.visible) {
                const pad = world.logistics.pad, p = world.logistics.stagePoints[d.target], intake = world.logistics.intake;
                const points = [new THREE.Vector3(pad.x, 1, pad.z), new THREE.Vector3(pad.x, 9, pad.z), new THREE.Vector3(p.x, 9, p.z), new THREE.Vector3(p.x, p.y + 2.9, p.z), new THREE.Vector3(p.x, 9, p.z), new THREE.Vector3(intake.x, 9, intake.z), new THREE.Vector3(intake.x, 5.1, intake.z)];
                harvestRoute.geometry.dispose();
                harvestRoute.geometry = new THREE.BufferGeometry().setFromPoints(points);
                harvestRoute.computeLineDistances();
            }
        }
    }
    let robotCargoKey = "";
    const bedBins = new THREE.Group();
    world.robot.cargoSocket.add(bedBins);
    const fertRoute = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#c5a156', dashSize: .7, gapSize: .5, transparent: true, opacity: .7 }));
    scene.add(fertRoute);
    fertRoute.visible = false;
    let fertRouteKey = '';
    function syncNewDevices(time, dt) {
        const sd = seeder.drone, sm = world.seeder;
        sm.group.position.copy(sd.position);
        sm.spray.visible = sd.state === 'sowing';
        if (!['ready', 'charging'].includes(sd.state)) {
            const a = sd.heading - sm.group.rotation.y;
            sm.group.rotation.y += Math.atan2(Math.sin(a), Math.cos(a)) * Math.min(1, dt * 8);
            sm.rotors.forEach((r, j) => r.rotation.y += dt * 46 * (j % 2 ? 1 : -1));
        }
        const f = fertilizer.drone, fm = world.fertilizer;
        fm.group.position.set(f.position.x, f.position.y, f.position.z);
        if (!['ready', 'charging'].includes(f.state)) {
            const angle = Math.atan2(Math.sin(f.heading - fm.group.rotation.y), Math.cos(f.heading - fm.group.rotation.y));
            fm.group.rotation.y += angle * Math.min(1, dt * 6);
            fm.rotors.forEach((r, i) => r.rotation.y += dt * 46 * (i % 2 ? 1 : -1));
        }
        fm.spray.visible = f.state === 'fertilizing';
        if (fm.spreader && fm.spray.visible)
            fm.spreader.rotation.y += dt * 18;
        const key = `${f.state}-${f.target}`;
        if (key !== fertRouteKey) {
            fertRouteKey = key;
            fertRoute.visible = f.target !== null && !['ready', 'charging'].includes(f.state);
            if (fertRoute.visible) {
                const field = fields[f.target], p = world.fertilizer.pad;
                fertRoute.geometry.dispose();
                fertRoute.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p.x, .4, p.z), new THREE.Vector3(p.x, 7, p.z), new THREE.Vector3(field.x - 7.5, 7, field.z - 5), new THREE.Vector3(field.x + 7.5, 7, field.z - 5)]);
                fertRoute.computeLineDistances();
            }
        }
        const r = picker.robot, rm = world.robot;
        rm.group.position.set(r.position.x, r.position.y, r.position.z);
        rm.group.rotation.y = r.heading;
        rm.wheels.forEach((w, j) => w.mesh.rotation[w.axis] = r.sideDistance[j % 2] / w.radius);
        const reach = r.armExtension, work = r.state === 'picking' ? 1.48 : .75;
        rm.armJoints[0].rotation.x = -1.42 * (1 - reach);
        rm.armJoints[1].rotation.x = 0;
        rm.armJoints[2].rotation.x = 0;
        rm.gripper.group.position.z = .12 + work * reach;
        rm.rail.scale.z = .10 + work * reach;
        rm.rail.position.z = .12 + work * reach * .5;
        rm.gripper.fingers.forEach(finger => { const side = finger.userData.side || Math.sign(finger.position.x) || 1; finger.position.x = side * (.22 - .1 * r.grip); });
        const cargoKey = r.loads.map(l => l.id).join('|');
        if (cargoKey !== robotCargoKey) {
            robotCargoKey = cargoKey;
            for (const child of [...bedBins.children]) {
                bedBins.remove(child);
                disposeCargo(child);
            }
            // Compact reusable field bins: 2 × 2 per layer, up to four visible layers. Manifest keeps every crate ID.
            for (const [j, load] of r.loads.slice(0, 16).entries()) {
                const bin = createCargo(load);
                bin.scale.setScalar(.43);
                bin.position.set((j % 2 - .5) * .61, -.7 + .7 * .43 + Math.floor(j / 4) * .34, -.10 + (Math.floor(j / 2) % 2 - .5) * .5);
                bedBins.add(bin);
            }
        }
        if (followDevice) {
            const state = followDevice === 'harvest' ? harvest.drone : followDevice === 'robot' ? picker.robot : followDevice === 'seeder' ? seeder.drone : fertilizer.drone;
            const p = state.position, target = new THREE.Vector3(p.x, p.y + (followDevice === 'robot' ? .5 : -1), p.z);
            controls.target.lerp(target, .14);
            camera.position.lerp(target.clone().add(followDevice === 'robot' ? new THREE.Vector3(8, 6, 11) : new THREE.Vector3(11, 8, 15)), .08);
        }
    }
    const routeKeys = [];
    function syncModels(time, dt) {
        simulation.drones.forEach((d, i) => {
            const model = world.drones[i];
            model.group.position.set(d.position.x, d.position.y, d.position.z);
            if (['outbound', 'irrigating', 'returning'].includes(d.state)) {
                model.group.position.y += Math.sin(time * 3 + i) * .065;
                const delta = Math.atan2(Math.sin(d.heading - model.group.rotation.y), Math.cos(d.heading - model.group.rotation.y));
                model.group.rotation.y += delta * Math.min(1, dt * 6);
                model.rotors.forEach((r, j) => r.rotation.y += dt * 47 * (j % 2 ? 1 : -1));
            }
            model.spray.visible = d.state === 'irrigating';
            const key = `${d.target}-${d.state}`;
            if (routeKeys[i] !== key) {
                routeKeys[i] = key;
                routes[i].visible = d.target !== null && ['outbound', 'irrigating', 'returning'].includes(d.state);
                if (routes[i].visible) {
                    const f = fields[d.target], p = world.pads[i];
                    const pts = [new THREE.Vector3(p.x, .5, p.z), new THREE.Vector3(p.x, 7, p.z), new THREE.Vector3(f.x - 7.5, 7, f.z - 5), new THREE.Vector3(f.x + 7.5, 7, f.z - 5)];
                    routes[i].geometry.dispose();
                    routes[i].geometry = new THREE.BufferGeometry().setFromPoints(pts);
                    routes[i].computeLineDistances();
                }
            }
        });
        syncHarvest(time, dt);
        syncNewDevices(time, dt);
        world.animate(time);
    }
    let previousFit = 1;
    function resize() { const rect = $('scene').getBoundingClientRect(); renderer.setSize(rect.width, rect.height); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); const fit = cameraFit(); camera.position.sub(controls.target).multiplyScalar(fit / previousFit).add(controls.target); previousFit = fit; }
    new ResizeObserver(resize).observe($('scene'));
    resize();
    controls.update();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    renderer.domElement.addEventListener('pointerdown', e => { pointerStart = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('pointerup', e => {
        if (!pointerStart || Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 5)
            return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(world.fieldMeshes, false);
        if (hits.length)
            selectField(hits[0].object.userData.fieldIndex, true);
    });
    renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setPaused(true); toast('三维渲染连接已中断，请刷新页面重新加载。', 'warning'); });
    $('loading').style.opacity = '0';
    setTimeout(() => $('loading').remove(), 450);
    updateUI();
    let previous = performance.now(), visualTime = 0;
    function frame(now) {
        requestAnimationFrame(frame);
        const dt = Math.min((now - previous) / 1000, .1);
        previous = now;
        if (!paused) {
            const step = dt * speed;
            simulation.tick(step);
            fertilizer.tick(step);
            advanceGrowth(fields, step);
            picker.tick(step);
            seeder.tick(step);
            harvest.tick(step);
            visualTime += step;
        }
        syncModels(visualTime, paused ? 0 : dt * speed);
        if (cameraTransition) {
            const t = Math.min(1, (now - cameraTransition.start) / 650), ease = 1 - Math.pow(1 - t, 3);
            camera.position.lerpVectors(cameraTransition.from, cameraTransition.to, ease);
            controls.target.lerpVectors(cameraTransition.oldTarget, cameraTransition.target, ease);
            if (t >= 1)
                cameraTransition = null;
        }
        controls.update();
        renderer.render(scene, camera);
        if (now - lastUI > 250) {
            updateUI();
            lastUI = now;
        }
        if (now - lastScreen > 1000) {
            fields.forEach((f, i) => { world.updateScreen(i, f); world.syncCrop(i, f); });
            lastScreen = now;
        }
    }
    requestAnimationFrame(frame);
}
initializeScene().catch(error => {
    console.error('Farm initialization failed', error);
    $('loading').innerHTML = '<div class="error-message"><strong>暂时无法启动三维场景</strong><br><span>请使用支持 WebGL 2 的浏览器，并确认已完整解压文件包。</span><br><button class="button primary" id="reload-scene">重新加载</button></div>';
    $('reload-scene').addEventListener('click', () => location.reload());
    ['dispatch-button', 'return-button', 'dispatch-all', 'return-all', 'auto-toggle', 'harvest-dispatch', 'harvest-return', 'harvest-auto', 'fertilizer-dispatch', 'fertilizer-return', 'robot-drive', 'robot-pick', 'robot-haul', 'robot-return', 'seed-dispatch', 'seed-auto', 'seed-return'].forEach(id => $(id).disabled = true);
});

});
