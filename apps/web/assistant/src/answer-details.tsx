import type { PublicState } from "./types";
import { buildBlocks, renderBlock, type GenUiContext } from "./genui/registry";

interface AnswerDetailsProps extends GenUiContext {
  state: PublicState;
}

/** Everything the last turn contributed beyond the sentence text, in reading order. */
export function AnswerDetails({ state, application, busy, onAsk }: AnswerDetailsProps) {
  const blocks = buildBlocks(state, { application, busy, onAsk });
  if (!blocks.length) return null;
  return (
    <section className="details" aria-labelledby="details-heading">
      <h2 id="details-heading">About the latest answer</h2>
      {blocks.map((block, index) => (
        <div className="details__block" key={`${block.type}-${index}`}>
          {renderBlock(block, { application, busy, onAsk })}
        </div>
      ))}
    </section>
  );
}
