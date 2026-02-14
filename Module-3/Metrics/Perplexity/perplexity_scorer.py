"""
Perplexity scorer — computes perplexity directly using transformers + PyTorch.
Uses a causal language model (default: GPT-2) to measure how natural /
fluent the generated text is.  Lower perplexity = more fluent text.
"""

import torch
import numpy as np
from transformers import AutoModelForCausalLM, AutoTokenizer

# Cache loaded models to avoid reloading on every request
_model_cache: dict[str, tuple] = {}


def _get_model_and_tokenizer(model_id: str):
    """Load and cache model + tokenizer."""
    if model_id not in _model_cache:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = AutoModelForCausalLM.from_pretrained(model_id).to(device)
        model.eval()
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        # Set pad token if not defined
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        _model_cache[model_id] = (model, tokenizer, device)
    return _model_cache[model_id]


def compute_perplexity(
    texts: list[str],
    model_id: str = "gpt2",
    batch_size: int = 8,
) -> dict:
    """
    Compute perplexity for a list of text strings.

    Args:
        texts:      List of text strings to evaluate.
        model_id:   HuggingFace causal LM to use (default: gpt2).
        batch_size: Batch size for inference.

    Returns:
        {
            "perplexities": [float, ...],   # per-text scores
            "mean_perplexity": float,       # average across all texts
        }
    """
    # Filter out empty strings
    valid_texts = [t for t in texts if t and t.strip()]
    if not valid_texts:
        return {"perplexities": [], "mean_perplexity": 0.0}

    model, tokenizer, device = _get_model_and_tokenizer(model_id)
    ppls = []

    for i in range(0, len(valid_texts), batch_size):
        batch_texts = valid_texts[i : i + batch_size]

        encodings = tokenizer(
            batch_texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=model.config.n_positions if hasattr(model.config, "n_positions") else 1024,
            return_attention_mask=True,
        ).to(device)

        input_ids = encodings["input_ids"]
        attention_mask = encodings["attention_mask"]

        with torch.no_grad():
            outputs = model(input_ids, attention_mask=attention_mask, labels=input_ids)
            # outputs.loss is the mean cross-entropy over all tokens in the batch
            # We need per-sample perplexity, so compute manually
            logits = outputs.logits

        # Shift: predict next token from current token
        shift_logits = logits[:, :-1, :].contiguous()
        shift_labels = input_ids[:, 1:].contiguous()
        shift_mask = attention_mask[:, 1:].contiguous()

        # Per-token cross-entropy loss
        loss_fn = torch.nn.CrossEntropyLoss(reduction="none")
        loss = loss_fn(
            shift_logits.view(-1, shift_logits.size(-1)),
            shift_labels.view(-1),
        ).view(shift_labels.size())

        # Mask padding tokens and compute per-sample mean loss → perplexity
        for j in range(loss.size(0)):
            mask_sum = shift_mask[j].sum()
            if mask_sum == 0:
                ppls.append(0.0)
                continue
            sample_loss = (loss[j] * shift_mask[j]).sum() / mask_sum
            ppl = torch.exp(sample_loss).item()
            # Replace NaN/Inf with 0.0 (happens with very short texts)
            if np.isnan(ppl) or np.isinf(ppl):
                ppl = 0.0
            ppls.append(round(ppl, 2))

    valid_ppls = [p for p in ppls if p > 0]
    mean = round(float(np.mean(valid_ppls)), 2) if valid_ppls else 0.0

    return {
        "perplexities": ppls,
        "mean_perplexity": mean,
    }
