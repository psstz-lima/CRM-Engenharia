import { Request, Response } from 'express';
import { DashboardController } from '../../src/controllers/dashboard.controller';
import prisma from '../../src/config/database';

describe('DashboardController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRequest = {};
        mockResponse = {
            json: mockJson,
            status: mockStatus
        };
    });

    describe('getStats', () => {
        it('deve retornar estatísticas do dashboard', async () => {
            // Mock dos dados
            (prisma.contract.count as jest.Mock).mockResolvedValue(10);
            (prisma.measurement.count as jest.Mock).mockResolvedValue(25);
            (prisma.company.count as jest.Mock).mockResolvedValue(5);
            (prisma.user.count as jest.Mock).mockResolvedValue(15);

            await DashboardController.getStats(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockJson).toHaveBeenCalled();
            const response = mockJson.mock.calls[0][0];
            expect(response).toHaveProperty('totals');
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            (prisma.contract.count as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await DashboardController.getStats(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockStatus).toHaveBeenCalledWith(500);
        });
    });
});
