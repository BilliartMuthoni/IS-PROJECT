"""Grad-CAM: which parts of a photo pushed the model towards its answer.

The last block of feature maps keeps a rough picture of where things are in the
image. Grad-CAM weights each feature map by how much it raised the score of the
chosen class and adds them up, giving a heatmap over the photo (Selvaraju et al.,
2017). A model that has learned the disease should light up the lesions, not the
background or the edge of the frame.
"""

import numpy as np
import torch
import torch.nn.functional as F
from torch import nn

# Layer whose output is the last block of feature maps, per architecture.
TARGET_LAYERS = {
    "efficientnet_b0": "features",
    "mobilenet_v3_large": "features",
    "resnet50": "layer4",
    "densenet121": "features",
    "convnext_tiny": "features",
    "swin_t": "features",
}
# torchvision's Swin returns feature maps as (batch, height, width, channels).
CHANNELS_LAST = {"swin_t"}


def grad_cam(model: nn.Module, architecture: str, image: torch.Tensor, class_index: int | None = None):
    """Heatmap (values 0-1, same height and width as image) and the class it explains.

    image is one normalised tensor (3, H, W) on the model's device. Without class_index
    the predicted class is explained.
    """
    layer = model.get_submodule(TARGET_LAYERS[architecture])
    captured = {}
    handle = layer.register_forward_hook(lambda _module, _inputs, output: captured.update(maps=output))
    model.eval()
    try:
        with torch.enable_grad():
            logits = model(image.unsqueeze(0))
            index = int(logits.argmax()) if class_index is None else class_index
            maps = captured["maps"]
            (gradients,) = torch.autograd.grad(logits[0, index], maps)
    finally:
        handle.remove()

    if architecture in CHANNELS_LAST:
        maps, gradients = maps.permute(0, 3, 1, 2), gradients.permute(0, 3, 1, 2)
    weights = gradients.mean(dim=(2, 3), keepdim=True)
    heatmap = torch.relu((weights * maps).sum(dim=1, keepdim=True))
    heatmap = F.interpolate(heatmap, size=image.shape[1:], mode="bilinear", align_corners=False)[0, 0]
    heatmap = heatmap / (heatmap.max() + 1e-8)
    return heatmap.detach().cpu().numpy(), index


def to_picture(image: torch.Tensor, mean, std) -> np.ndarray:
    """Undo the normalisation so a tensor can be shown with matplotlib (H, W, 3, values 0-1)."""
    picture = image.detach().cpu() * torch.tensor(std)[:, None, None] + torch.tensor(mean)[:, None, None]
    return picture.clamp(0, 1).permute(1, 2, 0).numpy()
