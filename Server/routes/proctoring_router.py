from fastapi import APIRouter, Request, File, UploadFile, status
from fastapi.responses import JSONResponse
from ..controllers.ProctoringController import ProctoringController

proctringRouter = APIRouter(
    prefix="/api/v1/proctoring",
    tags=["api_v1", "proctoring"],
)

@proctringRouter.post("/session/frame/{session_id}")
async def receive_frame(session_id: str, image: UploadFile = File(...)):
    try:
        controller = await ProctoringController.create_instance()
        result = await controller.process_frame(session_id, image)
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"error": str(e)})

@proctringRouter.get("/session/report/{session_id}")
async def get_report(session_id: str):
    controller = await ProctoringController.create_instance()
    result = controller.get_report(session_id)
    return JSONResponse(status_code=status.HTTP_200_OK, content=result)

@proctringRouter.delete("/session/end/{session_id}")
async def end_session(session_id: str):
    controller = await ProctoringController.create_instance()
    result = controller.end_session(session_id)
    return JSONResponse(status_code=status.HTTP_200_OK, content=result)