import * as React from "react";

import { ScoreCounterProps } from "./ScoreCounter.d";

const ScoreCounter: React.FC<ScoreCounterProps> = ({
  ref = null,
  className = "",
  onClick = e => console.info("Click"),
}) => {
  const clickHandler = e => onClick(e);
  return (
    <>
      <section className="scoreCounter">
        <div className="scoreCounterContain">
          <span className="label">Your Health Score:</span>
          <span className="scoreCount">No data</span>
          <div className="progressBar">
            <div className="fill" style={{ width: "80%" }}></div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ScoreCounter;
