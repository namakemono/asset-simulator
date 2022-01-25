import React from "react";

const normRand = function (mu:number, sigma:number) {
    const a = 1 - Math.random();
    const b = 1 - Math.random();
    const c = Math.sqrt(-2 * Math.log(a));
    if(0.5 - Math.random() > 0) {
        return c * Math.sin(Math.PI * 2 * b) * sigma + mu;
    } else {
        return c * Math.cos(Math.PI * 2 * b) * sigma + mu;
    }
};

interface Fund {
    name: string; // 銘柄
    value: number; // 現在の資産
    // cost: number; // 毎年の投資額(万円)
    mu: number; // リターン(平均)
    sigma: number; // リスク(標準偏差)
};

interface Props {
    age: number;        // 現在の年齢
    expenditure: number; // 年間支出(万円)
    // funds: Fund[];   // ポートフォリオ 
}

interface Result {
    survived: boolean;
    history: { t: number, x: number, y: number, r: number }[]
}
const simulate = (props: Props): Result => {
    let res: Result = {
        survived: true, // 目標の年数生き延びれたかどうか
        history: []
    };
    let x0 = 300; // 初期投資額(万円)
    let y0 = 100; // 現金 or 債権(万円)
    let p = props.expenditure; // 年間の支出(万円)
    let iDeCo = 14.4; // iDeCo(万円)
    let iDeCoAsset: Fund = {name: "iDeCo", value:0, mu:0.072, sigma:0.25};
    let q = 500; // 給料(手取り)
    let w = 150; // 生活防衛費
    let s = 240; // 年間の投資額(万円)
    let mu = 0.072; // リターン(平均)
    let sigma = 0.25; // リスク(標準偏差)
    let k = 10; // あと何年働くか(目標金額のほうが良いかも)
    let T = 50; // 何年先までシミュレーションしたいか
    // TODO(nishimori-m): 年金がもらえる年齢
    // TODO(nishimori-m): 
    let x = x0; // 投資額
    let y = y0; // 現金
    for (let t = 0; t < T; ++t) {
        const age = props.age + t;
        const r = normRand(mu, sigma);
        if ((y < 0) || (x < 0)) {
            res.survived = false; 
            break;
        }
        // 給料
        if (t < k) {
            y += q;
        }
        // iDeCo
        if (age < 60) {
            y -= iDeCo;
            iDeCoAsset.value = iDeCoAsset.value * (1 + r) + iDeCo;
        } else if (age === 60) {
            y += iDeCoAsset.value;
        }
        // 国民年金(厚生年金) + 健康保険
        if (age < 65) {
            y -= 30; 
        } else { // 年金の受け取り
            y += 100;
        }
        // 投資 or 切り崩し
        if (y < 0.2 * (x+y)) { // 債権の割合が20%を切っている
            y += p;
            x -= p;
        } else if (y >= w + s) { // 現金に余裕があるので投資
            y -= s;
            x += s;
        } else { // 生活防衛費が削られてる状況
            y += p;
            x -= p;
        }
        // 毎年の支出
        if (y > w + p) {
            y -= p;
        } else if (x >= p) { // 資産の切り崩し
            x -= p;
        } else {
            y -= p;
        }
        // 複利
        x = x * (1 + r);
        res.history.push({ t, x, y, r });
    }
    return res;
}
const calcWinRatio = (results:Result[]):number => {
    let numWin = 0;
    let numTotal = 0;
    results.map(result => {
        if (result.survived) {
            ++numWin;
        }
        ++numTotal;
    });
    return numWin / numTotal;
}
const App = () => {
    const [age, setAge] = React.useState<number>(30);
    const [expenditure, setExpenditure] = React.useState<number>(300);
    const [funds, setFunds] = React.useState<Fund[]>([{
        name: "海外株式",
        value: 1000,
        mu: 0.072,
        sigma: 0.25
    }]);
    let results = [];
    for (let k = 0; k < 100; ++k) {
        results.push(simulate({
            age,
            expenditure
        }));
    }
    const result = results[0];
    const winRatio = calcWinRatio(results);
    const handleChange = (index: number, key:string, value:any) => {
        let newFunds = funds.slice();
        if (key === "name") {
            newFunds[index].name = value;
        } else if (key === "value") {
            newFunds[index].value = value;
        } else if (key === "mu") {
            newFunds[index].mu = value;
        } else if (key === "sigma") {
            newFunds[index].sigma = value;
        }
        setFunds(newFunds);
    }
    return (
        <div>
            
            <div>
                <span>現在の年齢</span>
                <span><input type="text"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value))}
                ></input>歳</span>
            </div>
            <div>
                <span>年間の支出</span>
                <span><input type="text"
                    value={expenditure}
                    onChange={e => setExpenditure(parseInt(e.target.value))}
                ></input>万円</span>
                <span>(iDeCoや国民年金、健康保険を除く)</span>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>銘柄</th>
                            <th>初期投資額(万円)</th>
                            <th>リターン</th>
                            <th>リスク</th>
                        </tr>
                    </thead>
                    <tbody>
                    {funds.map((fund, index) => {
                        return (
                            <tr>
                                <td>
                                    <input type="text"
                                        value={fund.name}
                                        onChange={e => handleChange(index, "name", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input type="text"
                                        value={fund.value}
                                        onChange={e => handleChange(index, "value", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input type="text"
                                        value={fund.mu}
                                        onChange={e => handleChange(index, "mu", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input type="text"
                                        value={fund.sigma}
                                        onChange={e => handleChange(index, "sigma", e.target.value)}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div>
                <span>勝率:</span>
                <span>{Math.floor(100 * winRatio)}%</span>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>年数</th>
                            <th>株式</th>
                            <th>現金</th>
                            <th>リターン(%)</th>
                        </tr>
                    </thead>
                    <tbody>
                    {result.history.map(record => {
                        return (
                            <tr>
                                <td>{record.t}</td>
                                <td>{Math.floor(record.x)}</td>
                                <td>{Math.floor(record.y)}</td>
                                <td>{Math.floor(100 * record.r)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div>当シミュレーションを利用されたことにより生じたいかなる結果についても責任を負いません。</div>
        </div>
    );
}

export default App;
